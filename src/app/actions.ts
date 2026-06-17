"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, LEAGUE_COOKIE, getSessionUserId, getActiveLeague } from "@/lib/session";
import {
  getUser,
  getUserByName,
  getCredential,
  setCredential,
  clearCredential,
  ensureUser,
  savePrediction,
  updateUser,
  getUserPrediction,
} from "@/lib/data";
import { isAdmin, DEFAULT_THEME } from "@/lib/constants";
import {
  hashSecret,
  verifySecret,
  signSession,
  slugId,
  minSecretLength,
} from "@/lib/auth";
import {
  createLeague,
  joinLeague,
  isMember,
  getLeague,
  deleteLeague,
  requestToJoin,
  approveRequest,
  denyRequest,
} from "@/lib/leagues";
import { getMessages, addMessage } from "@/lib/chat";
import { saveGroupPrediction } from "@/lib/group-predictions";
import { saveKnockoutPrediction, saveKnockoutMethod } from "@/lib/knockout-predictions";
import { saveGroupOrder } from "@/lib/group-orders";
import { sendFriendRequest, acceptFriend, removeFriend } from "@/lib/friends";
import { recordSpyReveal, hasRevealed } from "@/lib/spy";
import { spyFee } from "@/lib/money";
import { notifyUser } from "@/lib/push";
import { createDuel, setDuelStatus } from "@/lib/duels";
import { createPot, joinPot } from "@/lib/pots";
import type { PotCriteria } from "@/lib/types";
import { getUsers } from "@/lib/data";
import { chrome } from "@/lib/display";
import { getProvider } from "@/lib/football-api/provider";
import { isLocked } from "@/lib/time";
import type { AppUser, ConfidenceMultiplier, Prediction } from "@/lib/types";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function setSessionCookie(userId: string, remember: boolean) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: ONE_YEAR } : {}),
  });
}

/** Optionally join a league via invite code straight after authenticating. */
async function maybeJoin(userId: string, joinCode?: string) {
  if (!joinCode) return;
  const res = await joinLeague(joinCode, userId);
  if (res.ok && res.league) {
    const store = await cookies();
    store.set(LEAGUE_COOKIE, res.league.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }
}

// --- auth: name + PIN/password -------------------------------------------

export async function signUp(input: {
  name: string;
  secret: string;
  flag?: string;
  theme?: string;
  remember?: boolean;
  joinCode?: string;
}) {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false as const, error: "Pick a name (2+ characters)." };
  const min = minSecretLength(name);
  if (input.secret.length < min)
    return { ok: false as const, error: `Password must be at least ${min} letters or numbers.` };
  if (await getUserByName(name))
    return { ok: false as const, error: "That name is taken — try another or log in." };

  const id = slugId(name);
  await ensureUser({
    id,
    name,
    flag: input.flag || "⚽",
    theme: input.theme || DEFAULT_THEME,
  });
  await setCredential(id, hashSecret(input.secret));
  await setSessionCookie(id, input.remember ?? true);
  await maybeJoin(id, input.joinCode);
  redirect("/dashboard");
}

export async function logIn(input: {
  name: string;
  secret: string;
  remember?: boolean;
  joinCode?: string;
}) {
  const user = await getUserByName(input.name.trim());
  if (!user) return { ok: false as const, error: "No account with that name. Sign up?" };

  const cred = await getCredential(user.id);
  if (!cred) {
    // Unclaimed seed account (e.g. Carina/Johnny): first PIN entered claims it.
    const min = minSecretLength(user.id);
    if (input.secret.length < min)
      return { ok: false as const, error: `Choose a PIN/password (${min}+ characters) to claim this account.` };
    await setCredential(user.id, hashSecret(input.secret));
  } else if (!verifySecret(input.secret, cred)) {
    return { ok: false as const, error: "Wrong PIN/password." };
  }

  await setSessionCookie(user.id, input.remember ?? true);
  await maybeJoin(user.id, input.joinCode);
  redirect("/dashboard");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}

export async function changePin(newSecret: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const min = minSecretLength(userId);
  if (newSecret.length < min)
    return { ok: false as const, error: `Password must be at least ${min} letters or numbers.` };
  await setCredential(userId, hashSecret(newSecret));
  return { ok: true as const };
}

/**
 * Admin-only: reset another player's PIN. If `newSecret` is given, sets it;
 * otherwise clears it so the friend picks a fresh PIN on their next login.
 */
export async function adminResetPin(input: { userId: string; newSecret?: string }) {
  const requesterId = await getSessionUserId();
  if (!requesterId) return { ok: false as const, error: "Not signed in" };
  if (!isAdmin(requesterId)) return { ok: false as const, error: "Admins only." };

  const target = await getUser(input.userId);
  if (!target) return { ok: false as const, error: "User not found." };

  const secret = input.newSecret?.trim();
  if (secret) {
    const min = minSecretLength(input.userId);
    if (secret.length < min)
      return { ok: false as const, error: `Password must be at least ${min} letters or numbers.` };
    await setCredential(input.userId, hashSecret(secret));
    return { ok: true as const, mode: "set" as const, name: target.name };
  }
  await clearCredential(input.userId);
  return { ok: true as const, mode: "cleared" as const, name: target.name };
}

// --- profile --------------------------------------------------------------

export async function updateProfile(patch: Partial<AppUser>) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Not signed in" };
  await updateUser(userId, patch);
  revalidatePath("/settings");
  revalidatePath(`/profile/${userId}`);
  return { ok: true };
}

// --- leagues --------------------------------------------------------------

export async function setActiveLeague(leagueId: string) {
  const store = await cookies();
  store.set(LEAGUE_COOKIE, leagueId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createLeagueAction(name: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const clean = name.trim();
  if (!clean) return { ok: false as const, error: "Give your league a name." };
  const league = await createLeague(clean, userId);
  const store = await cookies();
  store.set(LEAGUE_COOKIE, league.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
  revalidatePath("/leagues");
  return { ok: true as const, league };
}

export async function joinLeagueAction(code: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await joinLeague(code, userId);
  if (!res.ok || !res.league) return { ok: false as const, error: res.error ?? "Could not join." };
  const store = await cookies();
  store.set(LEAGUE_COOKIE, res.league.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
  revalidatePath("/leagues");
  return { ok: true as const, league: res.league };
}

export async function requestJoinAction(leagueId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await requestToJoin(leagueId, userId);
  if (!res.ok) return { ok: false as const, error: res.error ?? "Could not send request." };
  revalidatePath("/leagues");
  return { ok: true as const };
}

async function ownsOrAdmin(leagueId: string, userId: string): Promise<boolean> {
  const league = await getLeague(leagueId);
  return Boolean(league && (league.ownerId === userId || isAdmin(userId)));
}

export async function approveJoinAction(leagueId: string, targetUserId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  if (!(await ownsOrAdmin(leagueId, userId))) return { ok: false as const, error: "Owner only." };
  await approveRequest(leagueId, targetUserId);
  revalidatePath("/leagues");
  return { ok: true as const };
}

export async function denyJoinAction(leagueId: string, targetUserId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  if (!(await ownsOrAdmin(leagueId, userId))) return { ok: false as const, error: "Owner only." };
  await denyRequest(leagueId, targetUserId);
  revalidatePath("/leagues");
  return { ok: true as const };
}

export async function deleteLeagueAction(leagueId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const league = await getLeague(leagueId);
  if (!league) return { ok: false as const, error: "League not found." };
  if (league.ownerId !== userId && !isAdmin(userId)) {
    return { ok: false as const, error: "Only the owner or an admin can delete a league." };
  }
  await deleteLeague(leagueId);
  const store = await cookies();
  if (store.get(LEAGUE_COOKIE)?.value === leagueId) store.delete(LEAGUE_COOKIE);
  revalidatePath("/leagues");
  revalidatePath("/admin");
  return { ok: true as const };
}

// --- friends ---------------------------------------------------------------

export async function addFriendAction(targetId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await sendFriendRequest(userId, targetId);
  if (!res.ok) return { ok: false as const, error: res.error ?? "Could not send friend request." };
  revalidatePath(`/profile/${targetId}`);
  revalidatePath(`/profile/${userId}`);
  return { ok: true as const };
}

export async function acceptFriendAction(fromId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  await acceptFriend(userId, fromId);
  revalidatePath(`/profile/${userId}`);
  return { ok: true as const };
}

export async function removeFriendAction(otherId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  await removeFriend(userId, otherId);
  revalidatePath(`/profile/${userId}`);
  revalidatePath(`/profile/${otherId}`);
  return { ok: true as const };
}

// --- spying ----------------------------------------------------------------

/**
 * Pay to reveal a rival's hidden upcoming pick. The fee (which climbs as kickoff
 * nears) is computed server-side from the real kickoff and paid into the active
 * league's Spy Pot. Once kickoff passes the pick is free to view, so we never
 * charge for that. Idempotent — re-spying the same pick is free.
 */
export async function spyRevealAction(targetId: string, matchId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  if (targetId === userId) return { ok: false as const, error: "That's your own pick." };

  const match = await getProvider().getMatch(matchId);
  if (!match) return { ok: false as const, error: "Match not found." };
  // After kickoff everything is visible for free — nothing to buy.
  if (match.status !== "upcoming" || isLocked(match.kickoffAt, new Date())) {
    return { ok: true as const, fee: 0, alreadyVisible: true };
  }

  // Already paid? Re-revealing is free and changes nothing (keeps the snapshot).
  if (await hasRevealed(userId, targetId, matchId)) {
    return { ok: true as const, fee: 0 };
  }

  const fee = spyFee(match.kickoffAt);
  const league = await getActiveLeague(userId);
  // Freeze the rival's pick as it stands right now — you keep what you paid for.
  const snapshot = await getUserPrediction(targetId, matchId);
  const res = await recordSpyReveal({
    buyerId: userId,
    targetId,
    matchId,
    leagueId: league?.id ?? null,
    fee,
    snapshot,
  });
  if (!res.ok) return { ok: false as const, error: res.error ?? "Could not buy the reveal." };

  // Tell the spied player — adds tension and they can't be quietly scouted.
  const spy = await getUser(userId);
  await notifyUser(targetId, {
    title: "🤭 A chismosa is watching",
    body: `${spy?.name ?? "A rival"} paid $${fee} to peek at your pick — what a chismosa.`,
    url: `/matches/${matchId}`,
  });

  revalidatePath(`/matches/${matchId}`);
  return { ok: true as const, fee };
}

// --- friend-vs-friend duels ------------------------------------------------

export async function challengeFriendAction(
  matchId: string,
  opponentId: string,
  stake: number,
  mode: "SCORE" | "SPLIT" = "SCORE",
) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await createDuel(matchId, userId, opponentId, stake, mode);
  if (!res.ok) return { ok: false as const, error: res.error ?? "Could not create duel." };
  revalidatePath("/duels");
  revalidatePath(`/matches/${matchId}`);
  return { ok: true as const };
}

export async function respondDuelAction(duelId: string, accept: boolean) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await setDuelStatus(duelId, userId, accept ? "accepted" : "declined");
  if (!res.ok) return { ok: false as const, error: res.error ?? "Failed." };
  revalidatePath("/duels");
  return { ok: true as const };
}

// --- group pots ------------------------------------------------------------

export async function proposePotAction(matchId: string, ante: number, criteria: PotCriteria) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const league = await getActiveLeague(userId);
  if (!league) return { ok: false as const, error: "Join or create a league first." };
  const res = await createPot(matchId, league.id, userId, ante, criteria);
  if (!res.ok) return { ok: false as const, error: res.error ?? "Could not open the pot." };
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/duels");
  return { ok: true as const, potId: res.potId };
}

export async function joinPotAction(potId: string, matchId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await joinPot(potId, userId);
  if (!res.ok) return { ok: false as const, error: res.error ?? "Could not join the pot." };
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/duels");
  return { ok: true as const };
}

// --- daily streak ----------------------------------------------------------

function melbourneToday(): string {
  // yyyy-MM-dd in Melbourne, computed server-side.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function touchStreak(): Promise<{ streak: number; increased: boolean; milestone: number | null }> {
  const userId = await getSessionUserId();
  if (!userId) return { streak: 0, increased: false, milestone: null };
  const user = await getUser(userId);
  if (!user) return { streak: 0, increased: false, milestone: null };

  const today = melbourneToday();
  const last = user.lastActiveDate ?? null;
  if (last === today) {
    return { streak: user.streakCount ?? 1, increased: false, milestone: null };
  }

  // Was the last active day yesterday?
  const y = new Date(`${today}T00:00:00`);
  y.setDate(y.getDate() - 1);
  const yesterday = new Intl.DateTimeFormat("en-CA").format(y);
  const continued = last === yesterday;
  const streak = continued ? (user.streakCount ?? 0) + 1 : 1;

  await updateUser(userId, { streakCount: streak, lastActiveDate: today });
  const MILES = [3, 7, 14, 30];
  const milestone = MILES.includes(streak) ? streak : null;
  revalidatePath("/dashboard");
  return { streak, increased: true, milestone };
}

// --- group-winner predictions ---------------------------------------------

export async function saveGroupPick(groupName: string, teamId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await saveGroupPrediction(userId, groupName, teamId);
  revalidatePath("/predict-groups");
  revalidatePath("/leaderboard");
  return { ok: true as const, ...res };
}

export async function saveKnockoutMethodPick(matchId: string, method: "90" | "ET" | "PENS") {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  await saveKnockoutMethod(userId, matchId, method);
  revalidatePath("/knockout");
  revalidatePath("/leaderboard");
  return { ok: true as const };
}

export async function saveGroupOrderPick(groupName: string, teamIds: string[]) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await saveGroupOrder(userId, groupName, teamIds);
  revalidatePath("/predict-standings");
  revalidatePath("/leaderboard");
  return { ok: true as const, ...res };
}

export async function saveKnockoutPick(matchId: string, teamId: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  const res = await saveKnockoutPrediction(userId, matchId, teamId);
  revalidatePath("/knockout");
  revalidatePath("/leaderboard");
  return { ok: true as const, ...res };
}

// --- chat -----------------------------------------------------------------

export interface ChatLine {
  id: string;
  userId: string;
  name: string;
  flag: string;
  body: string;
  createdAt: string;
}

export async function fetchMessages(leagueId: string): Promise<{ ok: boolean; messages: ChatLine[] }> {
  const userId = await getSessionUserId();
  if (!userId || !(await isMember(leagueId, userId))) return { ok: false, messages: [] };
  const [msgs, users] = await Promise.all([getMessages(leagueId), getUsers()]);
  const map = new Map(users.map((u) => [u.id, u]));
  const messages: ChatLine[] = msgs.map((m) => {
    const u = map.get(m.userId);
    return {
      id: m.id,
      userId: m.userId,
      name: u?.name ?? "Player",
      flag: u ? chrome(u).flag : "⚽",
      body: m.body,
      createdAt: m.createdAt,
    };
  });
  return { ok: true, messages };
}

export async function sendMessage(leagueId: string, body: string) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  if (!(await isMember(leagueId, userId))) return { ok: false as const, error: "You're not in this league." };
  const text = body.trim().slice(0, 500);
  if (!text) return { ok: false as const, error: "Say something!" };
  await addMessage(leagueId, userId, text);
  return { ok: true as const };
}

// --- predictions ----------------------------------------------------------

export async function savePredictionAction(input: Prediction) {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false as const, error: "Not signed in" };
  if (userId !== input.userId) return { ok: false as const, error: "Wrong user" };

  const match = await getProvider().getMatch(input.matchId);
  if (!match) return { ok: false as const, error: "Match not found" };
  if (isLocked(match.kickoffAt, new Date())) {
    return { ok: false as const, error: "Predictions are locked — match has kicked off." };
  }

  const existing = await getUserPrediction(userId, input.matchId);
  if (existing?.lockedAt) {
    return { ok: false as const, error: "Prediction already locked." };
  }

  const saved = await savePrediction({
    ...input,
    confidenceMultiplier: (input.confidenceMultiplier ?? 1) as ConfidenceMultiplier,
  });
  revalidatePath(`/matches/${input.matchId}`);
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  return { ok: true as const, prediction: saved };
}

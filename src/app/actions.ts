"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, LEAGUE_COOKIE, getSessionUserId } from "@/lib/session";
import {
  getUserByName,
  getCredential,
  setCredential,
  ensureUser,
  savePrediction,
  updateUser,
  getUserPrediction,
} from "@/lib/data";
import {
  hashSecret,
  verifySecret,
  signSession,
  slugId,
  MIN_SECRET_LENGTH,
} from "@/lib/auth";
import { createLeague, joinLeague } from "@/lib/leagues";
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

// --- auth: name + PIN/password -------------------------------------------

export async function signUp(input: {
  name: string;
  secret: string;
  flag?: string;
  theme?: string;
  remember?: boolean;
}) {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false as const, error: "Pick a name (2+ characters)." };
  if (input.secret.length < MIN_SECRET_LENGTH)
    return { ok: false as const, error: `PIN/password must be at least ${MIN_SECRET_LENGTH} characters.` };
  if (await getUserByName(name))
    return { ok: false as const, error: "That name is taken — try another or log in." };

  const id = slugId(name);
  await ensureUser({
    id,
    name,
    flag: input.flag || "⚽",
    theme: input.theme || "carina",
  });
  await setCredential(id, hashSecret(input.secret));
  await setSessionCookie(id, input.remember ?? true);
  redirect("/dashboard");
}

export async function logIn(input: { name: string; secret: string; remember?: boolean }) {
  const user = await getUserByName(input.name.trim());
  if (!user) return { ok: false as const, error: "No account with that name. Sign up?" };

  const cred = await getCredential(user.id);
  if (!cred) {
    // Unclaimed seed account (e.g. Carina/Johnny): first PIN entered claims it.
    if (input.secret.length < MIN_SECRET_LENGTH)
      return { ok: false as const, error: `Choose a PIN/password (${MIN_SECRET_LENGTH}+ chars) to claim this account.` };
    await setCredential(user.id, hashSecret(input.secret));
  } else if (!verifySecret(input.secret, cred)) {
    return { ok: false as const, error: "Wrong PIN/password." };
  }

  await setSessionCookie(user.id, input.remember ?? true);
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
  if (newSecret.length < MIN_SECRET_LENGTH)
    return { ok: false as const, error: `PIN/password must be at least ${MIN_SECRET_LENGTH} characters.` };
  await setCredential(userId, hashSecret(newSecret));
  return { ok: true as const };
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

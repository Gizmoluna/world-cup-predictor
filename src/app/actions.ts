"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, LEAGUE_COOKIE, getSessionUserId } from "@/lib/session";
import {
  getUser,
  savePrediction,
  updateUser,
  getUserPrediction,
} from "@/lib/data";
import { createLeague, joinLeague } from "@/lib/leagues";
import { getProvider } from "@/lib/football-api/provider";
import { isLocked } from "@/lib/time";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AppUser, ConfidenceMultiplier, Prediction } from "@/lib/types";

const ONE_YEAR = 60 * 60 * 24 * 365;

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// --- demo auth (no Supabase) ---------------------------------------------

export async function loginAs(userId: string) {
  const user = await getUser(userId);
  if (!user) return { ok: false, error: "Unknown user" };
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: ONE_YEAR });
  redirect("/dashboard");
}

// --- Supabase auth (email magic link + Google) ---------------------------

export async function signInWithEmail(email: string) {
  if (!isSupabaseConfigured()) return { ok: false, error: "Auth not configured" };
  const sb = await createClient();
  const origin = await siteOrigin();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) return;
  const sb = await createClient();
  const origin = await siteOrigin();
  const { data } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (data?.url) redirect(data.url);
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const sb = await createClient();
    await sb.auth.signOut();
  } else {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
  }
  redirect("/");
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

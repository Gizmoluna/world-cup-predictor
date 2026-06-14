import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AppUser, League } from "@/lib/types";
import { getUser } from "@/lib/data";
import { verifySession } from "@/lib/auth";
import { getUserLeagues, getLeague, isMember } from "@/lib/leagues";

export const SESSION_COOKIE = "cvj_session";
export const LEAGUE_COOKIE = "cvj_league";

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  return getUser(id);
}

/** Use at the top of protected pages — redirects to login if not signed in. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

// --- leagues --------------------------------------------------------------

export async function getCurrentLeagueId(): Promise<string | null> {
  const store = await cookies();
  return store.get(LEAGUE_COOKIE)?.value ?? null;
}

/**
 * Resolve the active league for a user: selected (if a member) → their first
 * league → null (user is in no leagues yet and should join/create one).
 */
export async function getActiveLeague(userId: string): Promise<League | null> {
  const selectedId = await getCurrentLeagueId();
  if (selectedId && (await isMember(selectedId, userId))) {
    return getLeague(selectedId);
  }
  const mine = await getUserLeagues(userId);
  return mine[0] ?? null;
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AppUser, League } from "@/lib/types";
import { ensureUser, getUser } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getUserLeagues, getLeague, isMember, DEFAULT_LEAGUE_ID } from "@/lib/leagues";

export const SESSION_COOKIE = "cvj_user";
export const LEAGUE_COOKIE = "cvj_league";

export async function getSessionUserId(): Promise<string | null> {
  if (isSupabaseConfigured()) {
    const sb = await createClient();
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  }
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isSupabaseConfigured()) {
    const sb = await createClient();
    const { data } = await sb.auth.getUser();
    const authUser = data.user;
    if (!authUser) return null;
    // Bootstrap a profile row on first sign-in.
    const existing = await getUser(authUser.id);
    if (existing) return existing;
    const meta = authUser.user_metadata ?? {};
    return ensureUser({
      id: authUser.id,
      name: (meta.name as string) || (authUser.email?.split("@")[0] ?? "Player"),
      email: authUser.email ?? null,
      flag: (meta.flag as string) || "⚽",
      theme: (meta.theme as string) || "carina",
    });
  }
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
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

/** Resolve the active league for a user: selected (if a member) → first → OG. */
export async function getActiveLeague(userId: string): Promise<League | null> {
  const selectedId = await getCurrentLeagueId();
  if (selectedId && (await isMember(selectedId, userId))) {
    return getLeague(selectedId);
  }
  const mine = await getUserLeagues(userId);
  if (mine.length) return mine[0];
  return getLeague(DEFAULT_LEAGUE_ID);
}

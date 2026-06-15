// ---------------------------------------------------------------------------
// Leagues — private friend leagues with shareable invite codes.
//
// Predictions stay GLOBAL per user (one prediction per match); a league is just
// a membership grouping that slices the leaderboard/battle. Backed by Supabase
// when configured, otherwise an in-memory demo store seeded with the OG league.
// ---------------------------------------------------------------------------

import "server-only";
import type { AppUser, League } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser, getUsers } from "@/lib/data";

export const DEFAULT_LEAGUE_ID = "og";

// --- demo store -----------------------------------------------------------
const demoLeagues = new Map<string, League>([
  [DEFAULT_LEAGUE_ID, { id: DEFAULT_LEAGUE_ID, name: "Carina vs Johnny", ownerId: "carina", inviteCode: "CLASH26" }],
]);
const demoMembers = new Map<string, Set<string>>([
  [DEFAULT_LEAGUE_ID, new Set(["carina", "johnny"])],
]);

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// --- public API -----------------------------------------------------------

/** Every league in the system (admin view). */
export async function getAllLeagues(): Promise<League[]> {
  if (!isSupabaseConfigured()) {
    return [...demoLeagues.values()];
  }
  const sb = createServiceClient();
  const { data } = await sb.from("leagues").select("*").order("created_at");
  return (data ?? []).map(rowToLeague);
}

export async function getUserLeagues(userId: string): Promise<League[]> {
  if (!isSupabaseConfigured()) {
    return [...demoLeagues.values()].filter((l) => demoMembers.get(l.id)?.has(userId));
  }
  const sb = createServiceClient();
  const { data } = await sb
    .from("league_members")
    .select("leagues(*)")
    .eq("user_id", userId);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => rowToLeague(r.leagues));
}

export async function getLeague(id: string): Promise<League | null> {
  if (!isSupabaseConfigured()) return demoLeagues.get(id) ?? null;
  const sb = createServiceClient();
  const { data } = await sb.from("leagues").select("*").eq("id", id).maybeSingle();
  return data ? rowToLeague(data) : null;
}

export async function getLeagueByCode(code: string): Promise<League | null> {
  const norm = code.trim().toUpperCase();
  if (!isSupabaseConfigured()) {
    return [...demoLeagues.values()].find((l) => l.inviteCode === norm) ?? null;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("leagues").select("*").eq("invite_code", norm).maybeSingle();
  return data ? rowToLeague(data) : null;
}

export async function createLeague(name: string, ownerId: string): Promise<League> {
  const inviteCode = genCode();
  if (!isSupabaseConfigured()) {
    const id = `lg_${genCode().toLowerCase()}`;
    const league: League = { id, name, ownerId, inviteCode };
    demoLeagues.set(id, league);
    demoMembers.set(id, new Set([ownerId]));
    return league;
  }
  const sb = createServiceClient();
  const { data } = await sb
    .from("leagues")
    .insert({ name, owner_id: ownerId, invite_code: inviteCode })
    .select()
    .single();
  const league = rowToLeague(data);
  await sb.from("league_members").insert({ league_id: league.id, user_id: ownerId });
  return league;
}

export async function joinLeague(
  code: string,
  userId: string,
): Promise<{ ok: boolean; league?: League; error?: string }> {
  const league = await getLeagueByCode(code);
  if (!league) return { ok: false, error: "No league found for that code." };
  if (!isSupabaseConfigured()) {
    demoMembers.get(league.id)?.add(userId);
    return { ok: true, league };
  }
  const sb = createServiceClient();
  await sb
    .from("league_members")
    .upsert({ league_id: league.id, user_id: userId }, { onConflict: "league_id,user_id" });
  return { ok: true, league };
}

export async function getLeagueMembers(leagueId: string): Promise<AppUser[]> {
  if (!isSupabaseConfigured()) {
    const ids = demoMembers.get(leagueId) ?? new Set<string>();
    const all = await getUsers();
    return all.filter((u) => ids.has(u.id));
  }
  const sb = createServiceClient();
  const { data } = await sb.from("league_members").select("user_id").eq("league_id", leagueId);
  const ids = new Set<string>((data ?? []).map((r: { user_id: string }) => r.user_id));
  const members = await Promise.all([...ids].map((id) => getUser(id)));
  return members.filter((u): u is AppUser => Boolean(u));
}

export async function deleteLeague(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    demoLeagues.delete(id);
    demoMembers.delete(id);
    return;
  }
  const sb = createServiceClient();
  await sb.from("league_members").delete().eq("league_id", id);
  await sb.from("messages").delete().eq("league_id", id);
  await sb.from("leagues").delete().eq("id", id);
}

export async function isMember(leagueId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return Boolean(demoMembers.get(leagueId)?.has(userId));
  const members = await getLeagueMembers(leagueId);
  return members.some((m) => m.id === userId);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToLeague(r: any): League {
  return {
    id: r.id,
    name: r.name,
    ownerId: r.owner_id,
    inviteCode: r.invite_code,
    createdAt: r.created_at,
  };
}

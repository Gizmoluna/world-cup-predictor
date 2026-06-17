// ---------------------------------------------------------------------------
// Spy reveals: a player pays a fee to unlock a rival's hidden upcoming pick
// before kickoff. The fee is paid into that league's Spy Pot. Reveals are
// permanent and idempotent — you only ever pay once per (rival, match).
// ---------------------------------------------------------------------------

import "server-only";
import type { Prediction } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

export interface SpyReveal {
  buyerId: string;
  targetId: string;
  matchId: string;
  leagueId: string | null;
  fee: number;
  /** The rival's pick frozen at purchase time — you keep what you paid to see,
   *  even if they edit it afterwards. */
  snapshot?: Prediction | null;
  createdAt?: string;
}

const demo: SpyReveal[] = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowTo(r: any): SpyReveal {
  return {
    buyerId: r.buyer_id,
    targetId: r.target_id,
    matchId: r.match_id,
    leagueId: r.league_id,
    fee: r.fee,
    snapshot: r.snapshot ?? null,
    createdAt: r.created_at,
  };
}

async function all(): Promise<SpyReveal[]> {
  if (!isSupabaseConfigured()) return demo;
  const sb = createServiceClient();
  const { data } = await sb.from("spy_reveals").select("*");
  return (data ?? []).map(rowTo);
}

/** Record a purchase. Idempotent on (buyer, target, match) — never double-charges. */
export async function recordSpyReveal(rev: SpyReveal): Promise<{ ok: boolean; error?: string }> {
  const rows = await all();
  if (rows.some((r) => r.buyerId === rev.buyerId && r.targetId === rev.targetId && r.matchId === rev.matchId)) {
    return { ok: true };
  }
  if (!isSupabaseConfigured()) {
    demo.push(rev);
    return { ok: true };
  }
  const sb = createServiceClient();
  const { error } = await sb.from("spy_reveals").insert({
    buyer_id: rev.buyerId,
    target_id: rev.targetId,
    match_id: rev.matchId,
    league_id: rev.leagueId,
    fee: rev.fee,
    snapshot: rev.snapshot ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function hasRevealed(buyerId: string, targetId: string, matchId: string): Promise<boolean> {
  const rows = await all();
  return rows.some((r) => r.buyerId === buyerId && r.targetId === targetId && r.matchId === matchId);
}

/** Set of `${matchId}:${targetId}` this buyer has already unlocked. */
export async function getRevealKeysForBuyer(buyerId: string): Promise<Set<string>> {
  const rows = await all();
  return new Set(rows.filter((r) => r.buyerId === buyerId).map((r) => `${r.matchId}:${r.targetId}`));
}

/**
 * For one match, the picks this buyer has unlocked: targetId → the frozen
 * snapshot of that rival's prediction at the moment it was spied.
 */
export async function getBuyerRevealsForMatch(
  buyerId: string,
  matchId: string,
): Promise<Map<string, Prediction | null>> {
  const rows = await all();
  const m = new Map<string, Prediction | null>();
  for (const r of rows) {
    if (r.buyerId === buyerId && r.matchId === matchId) m.set(r.targetId, r.snapshot ?? null);
  }
  return m;
}

/** How many rivals have paid to see this player's pick on this match. */
export async function getSpyCountOnTarget(targetId: string, matchId: string): Promise<number> {
  const rows = await all();
  return rows.filter((r) => r.targetId === targetId && r.matchId === matchId).length;
}

/** Total fees each user has spent spying (positive numbers). */
export async function getSpySpendByUsers(userIds: string[]): Promise<Map<string, number>> {
  const idSet = new Set(userIds);
  const rows = await all();
  const m = new Map<string, number>();
  for (const r of rows) {
    if (idSet.has(r.buyerId)) m.set(r.buyerId, (m.get(r.buyerId) ?? 0) + r.fee);
  }
  return m;
}

/** The running Spy Pot for a league — every spy fee paid by its members. */
export async function getSpyPot(leagueId: string): Promise<number> {
  const rows = await all();
  return rows.filter((r) => r.leagueId === leagueId).reduce((s, r) => s + r.fee, 0);
}

// ---------------------------------------------------------------------------
// Friend-vs-friend wager duels: stake against a friend on a match; whoever's
// prediction scores higher takes the pot. Balance accumulates across battles.
// ---------------------------------------------------------------------------

import "server-only";
import { randomUUID } from "node:crypto";
import type { WagerDuel, DuelStatus } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/football-api/provider";
import { getUserPrediction } from "@/lib/data";

const demo: WagerDuel[] = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToDuel(r: any): WagerDuel {
  return {
    id: r.id,
    matchId: r.match_id,
    challengerId: r.challenger_id,
    opponentId: r.opponent_id,
    stake: r.stake,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getAllDuels(): Promise<WagerDuel[]> {
  if (!isSupabaseConfigured()) return demo;
  const sb = createServiceClient();
  const { data } = await sb.from("wager_duels").select("*");
  return (data ?? []).map(rowToDuel);
}

export async function getUserDuels(userId: string): Promise<WagerDuel[]> {
  return (await getAllDuels()).filter((d) => d.challengerId === userId || d.opponentId === userId);
}

export async function getMatchDuels(matchId: string): Promise<WagerDuel[]> {
  return (await getAllDuels()).filter((d) => d.matchId === matchId);
}

export async function createDuel(
  matchId: string,
  challengerId: string,
  opponentId: string,
  stake: number,
): Promise<{ ok: boolean; error?: string }> {
  if (challengerId === opponentId) return { ok: false, error: "Pick a friend." };
  const all = await getAllDuels();
  if (
    all.some(
      (d) =>
        d.matchId === matchId &&
        d.status !== "declined" &&
        ((d.challengerId === challengerId && d.opponentId === opponentId) ||
          (d.challengerId === opponentId && d.opponentId === challengerId)),
    )
  ) {
    return { ok: false, error: "You already have a duel with them on this match." };
  }
  const s = Math.max(1, Math.min(100, Math.round(stake)));
  if (!isSupabaseConfigured()) {
    demo.push({ id: randomUUID(), matchId, challengerId, opponentId, stake: s, status: "pending" });
    return { ok: true };
  }
  const sb = createServiceClient();
  const { error } = await sb.from("wager_duels").insert({
    match_id: matchId,
    challenger_id: challengerId,
    opponent_id: opponentId,
    stake: s,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setDuelStatus(id: string, userId: string, status: DuelStatus): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    const d = demo.find((x) => x.id === id);
    if (!d) return { ok: false, error: "Not found" };
    if (d.opponentId !== userId) return { ok: false, error: "Only the challenged player can respond." };
    d.status = status;
    return { ok: true };
  }
  const sb = createServiceClient();
  const { data } = await sb.from("wager_duels").select("opponent_id").eq("id", id).maybeSingle();
  if (!data) return { ok: false, error: "Not found" };
  if (data.opponent_id !== userId) return { ok: false, error: "Only the challenged player can respond." };
  await sb.from("wager_duels").update({ status }).eq("id", id);
  return { ok: true };
}

export interface DuelOutcome {
  settled: boolean;
  winnerId: string | null; // null = tie/push
  actual: string | null; // "2-1"
  challengerGuess: string | null;
  opponentGuess: string | null;
}

function guess(p: { predictedHomeScore: number | null; predictedAwayScore: number | null } | null): string | null {
  if (!p || p.predictedHomeScore == null || p.predictedAwayScore == null) return null;
  return `${p.predictedHomeScore}-${p.predictedAwayScore}`;
}

/**
 * Settle a duel on the closest correct scoreline (full-time / 90 min).
 * Exact beats close; equal closeness pushes; no prediction always loses.
 */
export async function resolveDuel(duel: WagerDuel): Promise<DuelOutcome> {
  const blank: DuelOutcome = { settled: false, winnerId: null, actual: null, challengerGuess: null, opponentGuess: null };
  if (duel.status !== "accepted") return blank;
  const match = await getProvider().getMatch(duel.matchId);
  if (!match || match.status !== "full_time" || match.homeScore == null || match.awayScore == null) return blank;
  const ah = match.homeScore;
  const aa = match.awayScore;
  const [cp, op] = await Promise.all([
    getUserPrediction(duel.challengerId, duel.matchId),
    getUserPrediction(duel.opponentId, duel.matchId),
  ]);
  const dist = (p: typeof cp) =>
    p && p.predictedHomeScore != null && p.predictedAwayScore != null
      ? Math.abs(p.predictedHomeScore - ah) + Math.abs(p.predictedAwayScore - aa)
      : Number.POSITIVE_INFINITY;
  const cD = dist(cp);
  const oD = dist(op);
  let winnerId: string | null = null;
  if (cD < oD) winnerId = duel.challengerId;
  else if (oD < cD) winnerId = duel.opponentId;
  return {
    settled: true,
    winnerId,
    actual: `${ah}-${aa}`,
    challengerGuess: guess(cp),
    opponentGuess: guess(op),
  };
}

/** Net fake-money balance from a user's settled duels. */
export async function getDuelBalance(userId: string): Promise<number> {
  const duels = (await getUserDuels(userId)).filter((d) => d.status === "accepted");
  let bal = 0;
  for (const d of duels) {
    const o = await resolveDuel(d);
    if (!o.settled || !o.winnerId) continue;
    bal += o.winnerId === userId ? d.stake : -d.stake;
  }
  return bal;
}

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
import { buildMatchResult } from "@/lib/scoring/buildMatchResult";
import { settleDuel, type DuelMode, type DuelLeg } from "@/lib/scoring/duel-settle";
import type { PotGuess, PotActual } from "@/lib/scoring/pots-settle";

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
    mode: r.mode === "SPLIT" ? "SPLIT" : "SCORE",
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
  mode: DuelMode = "SCORE",
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
  // SPLIT divides the stake three ways, so keep it a clean multiple of 3.
  let s = Math.max(1, Math.min(100, Math.round(stake)));
  if (mode === "SPLIT") s = Math.max(3, Math.round(s / 3) * 3);
  if (!isSupabaseConfigured()) {
    demo.push({ id: randomUUID(), matchId, challengerId, opponentId, stake: s, status: "pending", mode });
    return { ok: true };
  }
  const sb = createServiceClient();
  const { error } = await sb.from("wager_duels").insert({
    match_id: matchId,
    challenger_id: challengerId,
    opponent_id: opponentId,
    stake: s,
    status: "pending",
    mode,
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
  winnerId: string | null; // overall winner (sign of challengerNet); null = level
  challengerNet: number; // +/− from the challenger's perspective
  mode: DuelMode;
  legs: DuelLeg[]; // per-market breakdown (single SCORE leg for full mode)
  actual: string | null; // "2-1"
  challengerGuess: string | null;
  opponentGuess: string | null;
}

function guess(p: { predictedHomeScore: number | null; predictedAwayScore: number | null } | null): string | null {
  if (!p || p.predictedHomeScore == null || p.predictedAwayScore == null) return null;
  return `${p.predictedHomeScore}-${p.predictedAwayScore}`;
}

function toGuess(uid: string, p: { predictedHomeScore: number | null; predictedAwayScore: number | null; firstGoalScorerId?: string | null } | null): PotGuess {
  const h = p?.predictedHomeScore ?? null;
  const a = p?.predictedAwayScore ?? null;
  const result = h != null && a != null ? (h > a ? "home" : h < a ? "away" : "draw") : null;
  return { userId: uid, homeScore: h, awayScore: a, result: result as PotGuess["result"], firstScorerId: p?.firstGoalScorerId ?? null };
}

/**
 * Settle a duel. FULL (SCORE) mode: whole stake on the closest 90' scoreline.
 * SPLIT mode: stake divided across score / result / first-scorer, each leg
 * settled independently. Equal closeness / both-right / both-wrong pushes.
 */
export async function resolveDuel(duel: WagerDuel): Promise<DuelOutcome> {
  const mode: DuelMode = duel.mode === "SPLIT" ? "SPLIT" : "SCORE";
  const blank: DuelOutcome = {
    settled: false, winnerId: null, challengerNet: 0, mode, legs: [], actual: null,
    challengerGuess: null, opponentGuess: null,
  };
  if (duel.status !== "accepted") return blank;
  const match = await getProvider().getMatch(duel.matchId);
  if (!match || match.status !== "full_time" || match.homeScore == null || match.awayScore == null) return blank;

  const [cp, op] = await Promise.all([
    getUserPrediction(duel.challengerId, duel.matchId),
    getUserPrediction(duel.opponentId, duel.matchId),
  ]);

  // First scorer only matters (and is only fetched) for SPLIT duels.
  let firstScorerId: string | null = null;
  if (mode === "SPLIT") {
    const events = await getProvider().getMatchEvents(duel.matchId);
    firstScorerId = buildMatchResult(match, events, null).firstGoalScorerId ?? null;
  }
  const actual: PotActual = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    result: match.homeScore > match.awayScore ? "home" : match.homeScore < match.awayScore ? "away" : "draw",
    firstScorerId,
  };

  const s = settleDuel(mode, toGuess(duel.challengerId, cp), toGuess(duel.opponentId, op), actual, duel.stake);
  const winnerId = s.challengerNet > 0 ? duel.challengerId : s.challengerNet < 0 ? duel.opponentId : null;
  return {
    settled: true,
    winnerId,
    challengerNet: s.challengerNet,
    mode,
    legs: s.legs,
    actual: `${actual.homeScore}-${actual.awayScore}`,
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
    if (!o.settled) continue;
    bal += d.challengerId === userId ? o.challengerNet : -o.challengerNet;
  }
  return bal;
}

export interface LedgerMember {
  userId: string;
  net: number; // overall winnings (+) or debts (−) across settled duels
  won: number; // total $ won
  lost: number; // total $ lost
  pending: number; // $ riding on accepted-but-unsettled duels
}

export interface LedgerDebt {
  fromId: string; // owes
  toId: string; // owed
  amount: number; // net amount owed between this pair
}

export interface LeagueLedger {
  members: LedgerMember[];
  debts: LedgerDebt[]; // simplified "who owes whom" (net per pair)
}

/**
 * Per-league winnings & debts ledger. Looks only at duels between the given
 * member ids, resolves each settled one, and computes both per-member totals
 * and the net amount owed between every pair (so the group can settle up).
 */
export async function getLeagueLedger(memberIds: string[]): Promise<LeagueLedger> {
  const idSet = new Set(memberIds);
  const all = (await getAllDuels()).filter(
    (d) => d.status === "accepted" && idSet.has(d.challengerId) && idSet.has(d.opponentId),
  );

  const member = new Map<string, LedgerMember>(
    memberIds.map((id) => [id, { userId: id, net: 0, won: 0, lost: 0, pending: 0 }]),
  );
  // pairKey "a|b" (sorted) -> net owed to the *first* id in the key.
  const pair = new Map<string, number>();
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  for (const d of all) {
    const o = await resolveDuel(d);
    const a = member.get(d.challengerId)!;
    const b = member.get(d.opponentId)!;
    if (!o.settled) {
      a.pending += d.stake;
      b.pending += d.stake;
      continue;
    }
    if (o.challengerNet === 0) continue; // level — no money moves
    // challengerNet may be a partial amount (SPLIT duels), so use its magnitude.
    const amount = Math.abs(o.challengerNet);
    const winnerId = o.challengerNet > 0 ? d.challengerId : d.opponentId;
    const loserId = winnerId === d.challengerId ? d.opponentId : d.challengerId;
    member.get(winnerId)!.won += amount;
    member.get(winnerId)!.net += amount;
    member.get(loserId)!.lost += amount;
    member.get(loserId)!.net -= amount;

    const key = pairKey(winnerId, loserId);
    const first = key.split("|")[0];
    // positive = net owed TO `first`. Winner is owed by loser.
    pair.set(key, (pair.get(key) ?? 0) + (winnerId === first ? amount : -amount));
  }

  const debts: LedgerDebt[] = [];
  for (const [key, net] of pair) {
    if (net === 0) continue;
    const [first, second] = key.split("|");
    // net > 0: `first` is owed → `second` owes `first`.
    if (net > 0) debts.push({ fromId: second, toId: first, amount: net });
    else debts.push({ fromId: first, toId: second, amount: -net });
  }
  debts.sort((x, y) => y.amount - x.amount);

  return { members: [...member.values()].sort((x, y) => y.net - x.net), debts };
}

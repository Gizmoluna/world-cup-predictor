// ---------------------------------------------------------------------------
// Group (whole-league) pots: any member proposes a pot on a match with a fixed
// winning criteria + ante before kickoff. Others opt in by matching the ante.
// Their existing match prediction IS their entry. Closest/correct on the
// criteria takes the pot; ties split it; if nobody qualifies the stakes are
// refunded. The settlement core (settlePot) is pure and unit-tested.
// ---------------------------------------------------------------------------

import "server-only";
import type { PotCriteria, WagerPot, PotEntry, Prediction } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/football-api/provider";
import { buildMatchResult } from "@/lib/scoring/buildMatchResult";
import { getUserPrediction } from "@/lib/data";
import { settlePot, potPayouts, type PotActual, type PotGuess } from "@/lib/scoring/pots-settle";

export { settlePot, potPayouts } from "@/lib/scoring/pots-settle";
export type { PotActual, PotGuess, PotSettlement } from "@/lib/scoring/pots-settle";

// --- store -----------------------------------------------------------------

const demoPots: WagerPot[] = [];
const demoEntries: PotEntry[] = [];

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToPot(r: any): WagerPot {
  return {
    id: r.id,
    matchId: r.match_id,
    leagueId: r.league_id,
    proposerId: r.proposer_id,
    ante: r.ante,
    criteria: r.criteria,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getMatchPots(matchId: string, leagueId: string): Promise<WagerPot[]> {
  if (!isSupabaseConfigured()) {
    return demoPots.filter((p) => p.matchId === matchId && p.leagueId === leagueId);
  }
  const sb = createServiceClient();
  const { data } = await sb.from("wager_pots").select("*").eq("match_id", matchId).eq("league_id", leagueId);
  return (data ?? []).map(rowToPot);
}

export async function getLeaguePots(leagueId: string): Promise<WagerPot[]> {
  if (!isSupabaseConfigured()) return demoPots.filter((p) => p.leagueId === leagueId);
  const sb = createServiceClient();
  const { data } = await sb.from("wager_pots").select("*").eq("league_id", leagueId);
  return (data ?? []).map(rowToPot);
}

export async function getPotEntries(potId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return demoEntries.filter((e) => e.potId === potId).map((e) => e.userId);
  }
  const sb = createServiceClient();
  const { data } = await sb.from("pot_entries").select("user_id").eq("pot_id", potId);
  return (data ?? []).map((r: any) => r.user_id);
}

export async function createPot(
  matchId: string,
  leagueId: string,
  proposerId: string,
  ante: number,
  criteria: PotCriteria,
): Promise<{ ok: boolean; error?: string; potId?: string }> {
  const a = Math.max(1, Math.min(100, Math.round(ante)));
  if (!isSupabaseConfigured()) {
    const id = `pot_${demoPots.length + 1}`;
    demoPots.push({ id, matchId, leagueId, proposerId, ante: a, criteria, status: "open" });
    demoEntries.push({ potId: id, userId: proposerId });
    return { ok: true, potId: id };
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("wager_pots")
    .insert({ match_id: matchId, league_id: leagueId, proposer_id: proposerId, ante: a, criteria, status: "open" })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not open the pot." };
  await sb.from("pot_entries").insert({ pot_id: data.id, user_id: proposerId });
  return { ok: true, potId: data.id };
}

export async function joinPot(potId: string, userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    if (demoEntries.some((e) => e.potId === potId && e.userId === userId)) return { ok: true };
    demoEntries.push({ potId, userId });
    return { ok: true };
  }
  const sb = createServiceClient();
  const { error } = await sb.from("pot_entries").upsert(
    { pot_id: potId, user_id: userId },
    { onConflict: "pot_id,user_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface PotResult {
  settled: boolean;
  void: boolean;
  winnerIds: string[];
  entrantIds: string[];
  payouts: Map<string, number>;
}

/** Resolve a pot once its match is finished. */
export async function resolvePot(pot: WagerPot): Promise<PotResult> {
  const blank: PotResult = { settled: false, void: false, winnerIds: [], entrantIds: [], payouts: new Map() };
  const match = await getProvider().getMatch(pot.matchId);
  if (!match || match.status !== "full_time" || match.homeScore == null || match.awayScore == null) return blank;

  const entrantIds = await getPotEntries(pot.id);
  if (entrantIds.length === 0) return blank;

  // First scorer is only needed for that criteria (avoid an events fetch otherwise).
  let firstScorerId: string | null = null;
  if (pot.criteria === "FIRST_SCORER") {
    const events = await getProvider().getMatchEvents(pot.matchId);
    firstScorerId = buildMatchResult(match, events, null).firstGoalScorerId ?? null;
  }
  const actual: PotActual = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    result: match.homeScore > match.awayScore ? "home" : match.homeScore < match.awayScore ? "away" : "draw",
    firstScorerId,
  };

  const guesses: PotGuess[] = await Promise.all(
    entrantIds.map(async (uid) => {
      const p: Prediction | null = await getUserPrediction(uid, pot.matchId);
      const result =
        p && p.predictedHomeScore != null && p.predictedAwayScore != null
          ? p.predictedHomeScore > p.predictedAwayScore
            ? "home"
            : p.predictedHomeScore < p.predictedAwayScore
              ? "away"
              : "draw"
          : null;
      return {
        userId: uid,
        homeScore: p?.predictedHomeScore ?? null,
        awayScore: p?.predictedAwayScore ?? null,
        result: result as PotGuess["result"],
        firstScorerId: p?.firstGoalScorerId ?? null,
      };
    }),
  );

  const settlement = settlePot(pot.criteria, guesses, actual);
  return {
    settled: true,
    void: settlement.void,
    winnerIds: settlement.winnerIds,
    entrantIds,
    payouts: potPayouts(pot.ante, entrantIds, settlement),
  };
}

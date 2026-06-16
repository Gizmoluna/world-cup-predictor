// ---------------------------------------------------------------------------
// Knockout-stage predictions: pick the winner of each knockout match.
// Editable, but each change is tracked and penalised (like group futures).
// ---------------------------------------------------------------------------

import "server-only";
import type { KnockoutPrediction } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { changePenaltyFor } from "@/lib/scoring/points";

type Method = "90" | "ET" | "PENS" | null;
// demo store: userId -> (matchId -> {teamId, changeCount, penalty, method})
const demo = new Map<string, Map<string, { teamId: string; changeCount: number; penalty: number; method: Method }>>();

export async function getAllKnockoutPredictions(): Promise<KnockoutPrediction[]> {
  if (!isSupabaseConfigured()) {
    const out: KnockoutPrediction[] = [];
    for (const [userId, m] of demo)
      for (const [matchId, v] of m)
        out.push({ userId, matchId, teamId: v.teamId, method: v.method, changeCount: v.changeCount, penalty: v.penalty });
    return out;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("knockout_predictions").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    matchId: r.match_id,
    teamId: r.team_id,
    method: r.method ?? null,
    changeCount: r.change_count ?? 0,
    penalty: r.penalty ?? 0,
  }));
}

export async function getUserKnockoutPredictions(userId: string): Promise<KnockoutPrediction[]> {
  return (await getAllKnockoutPredictions()).filter((k) => k.userId === userId);
}

export async function saveKnockoutPrediction(
  userId: string,
  matchId: string,
  teamId: string,
): Promise<{ changed: boolean; changeCount: number; cost: number }> {
  if (!isSupabaseConfigured()) {
    if (!demo.has(userId)) demo.set(userId, new Map());
    const m = demo.get(userId)!;
    const prev = m.get(matchId);
    if (prev && prev.teamId === teamId) return { changed: false, changeCount: prev.changeCount, cost: 0 };
    const changeCount = prev ? prev.changeCount + 1 : 0;
    const cost = prev ? changePenaltyFor(changeCount) : 0;
    const penalty = (prev?.penalty ?? 0) + cost;
    m.set(matchId, { teamId, changeCount, penalty, method: prev?.method ?? null });
    return { changed: Boolean(prev), changeCount, cost };
  }
  const sb = createServiceClient();
  const { data: existing } = await sb
    .from("knockout_predictions")
    .select("team_id, change_count, penalty")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();
  if (existing && existing.team_id === teamId) {
    return { changed: false, changeCount: existing.change_count ?? 0, cost: 0 };
  }
  const changeCount = existing ? (existing.change_count ?? 0) + 1 : 0;
  const cost = existing ? changePenaltyFor(changeCount) : 0;
  const penalty = (existing?.penalty ?? 0) + cost;
  await sb
    .from("knockout_predictions")
    .upsert(
      { user_id: userId, match_id: matchId, team_id: teamId, change_count: changeCount, penalty },
      { onConflict: "user_id,match_id" },
    );
  return { changed: Boolean(existing), changeCount, cost };
}

/** Set the win method (90/ET/PENS) on an existing knockout pick. */
export async function saveKnockoutMethod(userId: string, matchId: string, method: Method): Promise<void> {
  if (!isSupabaseConfigured()) {
    const m = demo.get(userId);
    const prev = m?.get(matchId);
    if (prev) prev.method = method;
    return;
  }
  const sb = createServiceClient();
  await sb.from("knockout_predictions").update({ method }).eq("user_id", userId).eq("match_id", matchId);
}

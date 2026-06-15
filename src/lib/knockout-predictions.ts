// ---------------------------------------------------------------------------
// Knockout-stage predictions: pick the winner of each knockout match.
// Editable, but each change is tracked and penalised (like group futures).
// ---------------------------------------------------------------------------

import "server-only";
import type { KnockoutPrediction } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

// demo store: userId -> (matchId -> {teamId, changeCount})
const demo = new Map<string, Map<string, { teamId: string; changeCount: number }>>();

export async function getAllKnockoutPredictions(): Promise<KnockoutPrediction[]> {
  if (!isSupabaseConfigured()) {
    const out: KnockoutPrediction[] = [];
    for (const [userId, m] of demo)
      for (const [matchId, v] of m) out.push({ userId, matchId, teamId: v.teamId, changeCount: v.changeCount });
    return out;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("knockout_predictions").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    matchId: r.match_id,
    teamId: r.team_id,
    changeCount: r.change_count ?? 0,
  }));
}

export async function getUserKnockoutPredictions(userId: string): Promise<KnockoutPrediction[]> {
  return (await getAllKnockoutPredictions()).filter((k) => k.userId === userId);
}

export async function saveKnockoutPrediction(
  userId: string,
  matchId: string,
  teamId: string,
): Promise<{ changed: boolean; changeCount: number }> {
  if (!isSupabaseConfigured()) {
    if (!demo.has(userId)) demo.set(userId, new Map());
    const m = demo.get(userId)!;
    const prev = m.get(matchId);
    if (prev && prev.teamId === teamId) return { changed: false, changeCount: prev.changeCount };
    const changeCount = prev ? prev.changeCount + 1 : 0;
    m.set(matchId, { teamId, changeCount });
    return { changed: Boolean(prev), changeCount };
  }
  const sb = createServiceClient();
  const { data: existing } = await sb
    .from("knockout_predictions")
    .select("team_id, change_count")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();
  if (existing && existing.team_id === teamId) {
    return { changed: false, changeCount: existing.change_count ?? 0 };
  }
  const changeCount = existing ? (existing.change_count ?? 0) + 1 : 0;
  await sb
    .from("knockout_predictions")
    .upsert(
      { user_id: userId, match_id: matchId, team_id: teamId, change_count: changeCount },
      { onConflict: "user_id,match_id" },
    );
  return { changed: Boolean(existing), changeCount };
}

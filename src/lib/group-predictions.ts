// ---------------------------------------------------------------------------
// Group-winner predictions ("futures"). You can change a pick, but each change
// is tracked (change_count) and penalised at scoring time.
// ---------------------------------------------------------------------------

import "server-only";
import type { GroupPrediction } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { changePenaltyFor } from "@/lib/scoring/points";

// demo store: userId -> (groupName -> {teamId, changeCount, penalty})
const demo = new Map<string, Map<string, { teamId: string; changeCount: number; penalty: number }>>();

export async function getAllGroupPredictions(): Promise<GroupPrediction[]> {
  if (!isSupabaseConfigured()) {
    const out: GroupPrediction[] = [];
    for (const [userId, m] of demo)
      for (const [groupName, v] of m)
        out.push({ userId, groupName, teamId: v.teamId, changeCount: v.changeCount, penalty: v.penalty });
    return out;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("group_predictions").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    groupName: r.group_name,
    teamId: r.team_id,
    changeCount: r.change_count ?? 0,
    penalty: r.penalty ?? 0,
  }));
}

export async function getUserGroupPredictions(userId: string): Promise<GroupPrediction[]> {
  return (await getAllGroupPredictions()).filter((g) => g.userId === userId);
}

/** Save a pick. Returns whether it counted as a (penalised) change + the cost. */
export async function saveGroupPrediction(
  userId: string,
  groupName: string,
  teamId: string,
): Promise<{ changed: boolean; changeCount: number; cost: number }> {
  if (!isSupabaseConfigured()) {
    if (!demo.has(userId)) demo.set(userId, new Map());
    const m = demo.get(userId)!;
    const prev = m.get(groupName);
    if (prev && prev.teamId === teamId) return { changed: false, changeCount: prev.changeCount, cost: 0 };
    const changeCount = prev ? prev.changeCount + 1 : 0;
    const cost = prev ? changePenaltyFor(changeCount) : 0;
    const penalty = (prev?.penalty ?? 0) + cost;
    m.set(groupName, { teamId, changeCount, penalty });
    return { changed: Boolean(prev), changeCount, cost };
  }
  const sb = createServiceClient();
  const { data: existing } = await sb
    .from("group_predictions")
    .select("team_id, change_count, penalty")
    .eq("user_id", userId)
    .eq("group_name", groupName)
    .maybeSingle();
  if (existing && existing.team_id === teamId) {
    return { changed: false, changeCount: existing.change_count ?? 0, cost: 0 };
  }
  const changeCount = existing ? (existing.change_count ?? 0) + 1 : 0;
  const cost = existing ? changePenaltyFor(changeCount) : 0;
  const penalty = (existing?.penalty ?? 0) + cost;
  await sb
    .from("group_predictions")
    .upsert(
      { user_id: userId, group_name: groupName, team_id: teamId, change_count: changeCount, penalty },
      { onConflict: "user_id,group_name" },
    );
  return { changed: Boolean(existing), changeCount, cost };
}

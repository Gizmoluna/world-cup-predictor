// ---------------------------------------------------------------------------
// Full group-standings predictions: predict the finishing ORDER of each group.
// Stored as a comma-joined ordered list of team ids (1st → last).
// ---------------------------------------------------------------------------

import "server-only";
import type { GroupOrder } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { changePenaltyFor } from "@/lib/scoring/points";

// demo: userId -> (groupName -> {teamIds, changeCount, penalty})
const demo = new Map<string, Map<string, { teamIds: string[]; changeCount: number; penalty: number }>>();

export async function getAllGroupOrders(): Promise<GroupOrder[]> {
  if (!isSupabaseConfigured()) {
    const out: GroupOrder[] = [];
    for (const [userId, m] of demo)
      for (const [groupName, v] of m)
        out.push({ userId, groupName, teamIds: v.teamIds, changeCount: v.changeCount, penalty: v.penalty });
    return out;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("group_orders").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    groupName: r.group_name,
    teamIds: String(r.team_ids ?? "").split(",").filter(Boolean),
    changeCount: r.change_count ?? 0,
    penalty: r.penalty ?? 0,
  }));
}

export async function getUserGroupOrders(userId: string): Promise<GroupOrder[]> {
  return (await getAllGroupOrders()).filter((g) => g.userId === userId);
}

/**
 * How big an edit was: fraction of positions that moved (0..1). Swapping two
 * teams in a four-team group = 0.5; a full rewrite = 1. Used to scale the
 * change penalty so small tweaks cost less than wholesale re-rankings.
 */
function orderEditMagnitude(prev: string[], next: string[]): number {
  const len = Math.max(prev.length, next.length, 1);
  let moved = 0;
  for (let i = 0; i < len; i++) if (prev[i] !== next[i]) moved++;
  return moved / len;
}

/**
 * Save a group order. Returns whether it counted as a (penalised) change and
 * its cost — scaled down for small edits.
 */
export async function saveGroupOrder(
  userId: string,
  groupName: string,
  teamIds: string[],
): Promise<{ changed: boolean; changeCount: number; cost: number }> {
  if (!isSupabaseConfigured()) {
    if (!demo.has(userId)) demo.set(userId, new Map());
    const m = demo.get(userId)!;
    const prev = m.get(groupName);
    const same = prev && prev.teamIds.join(",") === teamIds.join(",");
    if (same) return { changed: false, changeCount: prev!.changeCount, cost: 0 };
    const changeCount = prev ? prev.changeCount + 1 : 0;
    const mag = prev ? orderEditMagnitude(prev.teamIds, teamIds) : 1;
    const cost = prev ? changePenaltyFor(changeCount, mag) : 0;
    const penalty = (prev?.penalty ?? 0) + cost;
    m.set(groupName, { teamIds, changeCount, penalty });
    return { changed: Boolean(prev), changeCount, cost };
  }
  const sb = createServiceClient();
  const { data: existing } = await sb
    .from("group_orders")
    .select("team_ids, change_count, penalty")
    .eq("user_id", userId)
    .eq("group_name", groupName)
    .maybeSingle();
  const prevIds = existing ? String(existing.team_ids ?? "").split(",").filter(Boolean) : null;
  if (prevIds && prevIds.join(",") === teamIds.join(",")) {
    return { changed: false, changeCount: existing.change_count ?? 0, cost: 0 };
  }
  const changeCount = existing ? (existing.change_count ?? 0) + 1 : 0;
  const mag = prevIds ? orderEditMagnitude(prevIds, teamIds) : 1;
  const cost = prevIds ? changePenaltyFor(changeCount, mag) : 0;
  const penalty = (existing?.penalty ?? 0) + cost;
  await sb
    .from("group_orders")
    .upsert(
      { user_id: userId, group_name: groupName, team_ids: teamIds.join(","), change_count: changeCount, penalty },
      { onConflict: "user_id,group_name" },
    );
  return { changed: Boolean(existing), changeCount, cost };
}

// Points per finishing position correctly predicted (1st..4th) + perfect bonus.
export const GROUP_ORDER_POINTS = [10, 5, 3, 3];
export const GROUP_ORDER_PERFECT_BONUS = 5;

export function scoreGroupOrder(predicted: string[], actual: string[]): { points: number; firstCorrect: boolean } {
  let points = 0;
  let exactCount = 0;
  for (let i = 0; i < actual.length; i++) {
    if (predicted[i] && predicted[i] === actual[i]) {
      points += GROUP_ORDER_POINTS[i] ?? 2;
      exactCount++;
    }
  }
  if (exactCount === actual.length && actual.length > 0) points += GROUP_ORDER_PERFECT_BONUS;
  return { points, firstCorrect: predicted[0] === actual[0] };
}

// ---------------------------------------------------------------------------
// Full group-standings predictions: predict the finishing ORDER of each group.
// Stored as a comma-joined ordered list of team ids (1st → last).
// ---------------------------------------------------------------------------

import "server-only";
import type { GroupOrder } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

// demo: userId -> (groupName -> ordered ids)
const demo = new Map<string, Map<string, string[]>>();

export async function getAllGroupOrders(): Promise<GroupOrder[]> {
  if (!isSupabaseConfigured()) {
    const out: GroupOrder[] = [];
    for (const [userId, m] of demo) for (const [groupName, teamIds] of m) out.push({ userId, groupName, teamIds });
    return out;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("group_orders").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    userId: r.user_id,
    groupName: r.group_name,
    teamIds: String(r.team_ids ?? "").split(",").filter(Boolean),
  }));
}

export async function getUserGroupOrders(userId: string): Promise<GroupOrder[]> {
  return (await getAllGroupOrders()).filter((g) => g.userId === userId);
}

export async function saveGroupOrder(userId: string, groupName: string, teamIds: string[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (!demo.has(userId)) demo.set(userId, new Map());
    demo.get(userId)!.set(groupName, teamIds);
    return;
  }
  const sb = createServiceClient();
  await sb
    .from("group_orders")
    .upsert({ user_id: userId, group_name: groupName, team_ids: teamIds.join(",") }, { onConflict: "user_id,group_name" });
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

// ---------------------------------------------------------------------------
// Group-winner predictions (a "futures" market): pick who tops each group.
// Backed by Supabase when configured, in-memory otherwise.
// ---------------------------------------------------------------------------

import "server-only";
import type { GroupPrediction } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

// demo store: userId -> (groupName -> teamId)
const demo = new Map<string, Map<string, string>>();

export async function getAllGroupPredictions(): Promise<GroupPrediction[]> {
  if (!isSupabaseConfigured()) {
    const out: GroupPrediction[] = [];
    for (const [userId, m] of demo) for (const [groupName, teamId] of m) out.push({ userId, groupName, teamId });
    return out;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("group_predictions").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({ userId: r.user_id, groupName: r.group_name, teamId: r.team_id }));
}

export async function getUserGroupPredictions(userId: string): Promise<GroupPrediction[]> {
  return (await getAllGroupPredictions()).filter((g) => g.userId === userId);
}

export async function saveGroupPrediction(userId: string, groupName: string, teamId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (!demo.has(userId)) demo.set(userId, new Map());
    demo.get(userId)!.set(groupName, teamId);
    return;
  }
  const sb = createServiceClient();
  await sb
    .from("group_predictions")
    .upsert({ user_id: userId, group_name: groupName, team_id: teamId }, { onConflict: "user_id,group_name" });
}

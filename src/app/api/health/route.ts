import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABLES = [
  "users",
  "predictions",
  "prediction_scores",
  "badges",
  "user_badges",
  "leagues",
  "league_members",
  "messages",
  "group_predictions",
  "knockout_predictions",
  "join_requests",
  "friend_requests",
  "push_subscriptions",
];

// Reports which DB tables exist; with ?key=<CRON_SECRET>, also a data snapshot.
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "demo", tables: {} });
  }
  const sb = createServiceClient();
  const tables: Record<string, string> = {};
  for (const t of TABLES) {
    const { error } = await sb.from(t).select("*", { count: "exact", head: true });
    tables[t] = error ? `MISSING (${error.message})` : "ok";
  }
  const missing = Object.entries(tables).filter(([, v]) => v !== "ok").map(([k]) => k);

  const authorized =
    !process.env.CRON_SECRET || req.nextUrl.searchParams.get("key") === process.env.CRON_SECRET;
  let data: unknown = undefined;
  if (authorized) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [{ data: users }, { data: preds }, { data: members }, { data: leagues }, { data: friends }, { data: joins }] =
      await Promise.all([
        sb.from("users").select("id, name"),
        sb.from("predictions").select("user_id, match_id"),
        sb.from("league_members").select("user_id, league_id"),
        sb.from("leagues").select("id, name, owner_id, invite_code"),
        sb.from("friend_requests").select("from_user, to_user, status"),
        sb.from("join_requests").select("league_id, user_id, status"),
      ]);
    const predCount: Record<string, number> = {};
    for (const p of preds ?? []) predCount[(p as any).user_id] = (predCount[(p as any).user_id] ?? 0) + 1;
    const leaguesByUser: Record<string, string[]> = {};
    for (const m of members ?? []) (leaguesByUser[(m as any).user_id] ??= []).push((m as any).league_id);
    data = {
      players: (users ?? []).map((u: any) => ({
        id: u.id,
        name: u.name,
        predictions: predCount[u.id] ?? 0,
        leagues: leaguesByUser[u.id] ?? [],
      })),
      totalPredictions: (preds ?? []).length,
      leagues: (leagues ?? []).map((l: any) => ({ id: l.id, name: l.name, owner: l.owner_id, code: l.invite_code })),
      friendRequests: friends ?? [],
      joinRequests: joins ?? [],
    };
  }

  return NextResponse.json({ ok: missing.length === 0, mode: "supabase", missing, tables, data });
}

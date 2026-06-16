import { NextResponse } from "next/server";
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

// Reports which DB tables exist, so missing migrations are obvious.
export async function GET() {
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
  return NextResponse.json({ ok: missing.length === 0, mode: "supabase", missing, tables });
}

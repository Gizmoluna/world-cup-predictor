// ---------------------------------------------------------------------------
// League chat — trash talk, scoped per league. Backed by Supabase when
// configured, in-memory otherwise. Polled by the client (no realtime needed
// for a friends-sized group).
// ---------------------------------------------------------------------------

import "server-only";
import type { ChatMessage } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

const MAX = 100;

// demo store
const demoMessages = new Map<string, ChatMessage[]>();

export async function getMessages(leagueId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) {
    return (demoMessages.get(leagueId) ?? []).slice(-MAX);
  }
  const sb = createServiceClient();
  const { data } = await sb
    .from("messages")
    .select("*")
    .eq("league_id", leagueId)
    .order("created_at", { ascending: false })
    .limit(MAX);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    leagueId: r.league_id,
    userId: r.user_id,
    body: r.body,
    createdAt: r.created_at,
  }));
  return rows.reverse(); // oldest → newest
}

export async function addMessage(
  leagueId: string,
  userId: string,
  body: string,
): Promise<ChatMessage> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    const list = demoMessages.get(leagueId) ?? [];
    const msg: ChatMessage = {
      id: `${now}_${list.length}`,
      leagueId,
      userId,
      body,
      createdAt: now,
    };
    list.push(msg);
    demoMessages.set(leagueId, list.slice(-500));
    return msg;
  }
  const sb = createServiceClient();
  const { data } = await sb
    .from("messages")
    .insert({ league_id: leagueId, user_id: userId, body })
    .select()
    .maybeSingle();
  return {
    id: data?.id ?? `${now}_local`,
    leagueId: data?.league_id ?? leagueId,
    userId: data?.user_id ?? userId,
    body: data?.body ?? body,
    createdAt: data?.created_at ?? now,
  };
}

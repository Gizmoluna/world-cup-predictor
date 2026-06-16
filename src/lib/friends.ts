// ---------------------------------------------------------------------------
// Friends: directed requests that become a friendship once accepted.
// ---------------------------------------------------------------------------

import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

export type FriendState = "friends" | "incoming" | "outgoing" | "none";

interface Row {
  from: string;
  to: string;
  status: "pending" | "accepted";
}

const demo: Row[] = [];

async function all(): Promise<Row[]> {
  if (!isSupabaseConfigured()) return demo;
  const sb = createServiceClient();
  const { data } = await sb.from("friend_requests").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({ from: r.from_user, to: r.to_user, status: r.status }));
}

function findPair(rows: Row[], a: string, b: string): Row | undefined {
  return rows.find((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a));
}

export async function sendFriendRequest(from: string, to: string): Promise<{ ok: boolean; error?: string }> {
  if (from === to) return { ok: false };
  const rows = await all();
  const existing = findPair(rows, from, to);
  if (existing?.status === "accepted") return { ok: true };
  // If they already asked me, accept it (mutual).
  if (existing && existing.from === to && existing.status === "pending") {
    return acceptFriend(from, to);
  }
  if (existing) return { ok: true }; // already outgoing
  if (!isSupabaseConfigured()) {
    demo.push({ from, to, status: "pending" });
    return { ok: true };
  }
  const sb = createServiceClient();
  const { error } = await sb.from("friend_requests").upsert(
    { from_user: from, to_user: to, status: "pending" },
    { onConflict: "from_user,to_user" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function acceptFriend(me: string, other: string): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) {
    const r = demo.find((x) => x.from === other && x.to === me);
    if (r) r.status = "accepted";
    return { ok: true };
  }
  const sb = createServiceClient();
  await sb
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("from_user", other)
    .eq("to_user", me);
  return { ok: true };
}

export async function removeFriend(me: string, other: string): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) {
    for (let i = demo.length - 1; i >= 0; i--) {
      const r = demo[i];
      if ((r.from === me && r.to === other) || (r.from === other && r.to === me)) demo.splice(i, 1);
    }
    return { ok: true };
  }
  const sb = createServiceClient();
  await sb.from("friend_requests").delete().or(
    `and(from_user.eq.${me},to_user.eq.${other}),and(from_user.eq.${other},to_user.eq.${me})`,
  );
  return { ok: true };
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const rows = await all();
  return rows
    .filter((r) => r.status === "accepted" && (r.from === userId || r.to === userId))
    .map((r) => (r.from === userId ? r.to : r.from));
}

export async function getIncomingRequests(userId: string): Promise<string[]> {
  const rows = await all();
  return rows.filter((r) => r.to === userId && r.status === "pending").map((r) => r.from);
}

/** One-pass map of this user's relationship to everyone they have a row with. */
export async function getFriendStateMap(userId: string): Promise<Map<string, FriendState>> {
  const rows = await all();
  const map = new Map<string, FriendState>();
  for (const r of rows) {
    if (r.from !== userId && r.to !== userId) continue;
    const other = r.from === userId ? r.to : r.from;
    map.set(other, r.status === "accepted" ? "friends" : r.from === userId ? "outgoing" : "incoming");
  }
  return map;
}

export async function friendState(me: string, other: string): Promise<FriendState> {
  if (me === other) return "none";
  const rows = await all();
  const r = findPair(rows, me, other);
  if (!r) return "none";
  if (r.status === "accepted") return "friends";
  return r.from === me ? "outgoing" : "incoming";
}

// ---------------------------------------------------------------------------
// Password-reset tokens: a one-time, expiring token that lets a user set a new
// PIN. Backed by Supabase when configured, in-memory otherwise (demo/dev).
// ---------------------------------------------------------------------------

import "server-only";
import { randomBytes } from "node:crypto";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

const TTL_MS = 60 * 60 * 1000; // 1 hour

interface Row {
  token: string;
  userId: string;
  expiresAt: number; // epoch ms
}

const demo = new Map<string, Row>();

function newToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Create + persist a reset token for a user. Returns the raw token. */
export async function createResetToken(userId: string): Promise<string> {
  const token = newToken();
  const expiresAt = Date.now() + TTL_MS;
  if (!isSupabaseConfigured()) {
    demo.set(token, { token, userId, expiresAt });
    return token;
  }
  const sb = createServiceClient();
  await sb.from("password_resets").insert({
    token,
    user_id: userId,
    expires_at: new Date(expiresAt).toISOString(),
  });
  return token;
}

/** Resolve a token to its userId if valid + unexpired, else null. */
export async function getResetUserId(token: string): Promise<string | null> {
  if (!token) return null;
  if (!isSupabaseConfigured()) {
    const r = demo.get(token);
    if (!r || r.expiresAt < Date.now()) return null;
    return r.userId;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("password_resets").select("*").eq("token", token).maybeSingle();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const row = data as any;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return row.user_id as string;
}

/** Burn a token after a successful reset so it can't be reused. */
export async function consumeResetToken(token: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    demo.delete(token);
    return;
  }
  const sb = createServiceClient();
  await sb.from("password_resets").delete().eq("token", token);
}

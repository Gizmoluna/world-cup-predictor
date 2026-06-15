// ---------------------------------------------------------------------------
// Web push: store subscriptions + send notifications (predict reminders).
// No-ops cleanly when VAPID keys aren't configured.
// ---------------------------------------------------------------------------

import "server-only";
import webpush from "web-push";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import { getProvider } from "@/lib/football-api/provider";
import { getAllPredictions } from "@/lib/data";

export interface StoredSub {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidReady = false;
export function vapidConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}
function ensureVapid(): boolean {
  if (!vapidConfigured()) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:hello@worldcuppredictor.app",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    vapidReady = true;
  }
  return true;
}

// demo store
const demo = new Map<string, StoredSub>(); // endpoint -> sub

export async function saveSubscription(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const row: StoredSub = { userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
  if (!isSupabaseConfigured()) {
    demo.set(sub.endpoint, row);
    return;
  }
  const sb = createServiceClient();
  await sb.from("push_subscriptions").upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: "endpoint" },
  );
}

export async function getAllSubscriptions(): Promise<StoredSub[]> {
  if (!isSupabaseConfigured()) return [...demo.values()];
  const sb = createServiceClient();
  const { data } = await sb.from("push_subscriptions").select("*");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({ userId: r.user_id, endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }));
}

async function removeSubscription(endpoint: string) {
  if (!isSupabaseConfigured()) {
    demo.delete(endpoint);
    return;
  }
  const sb = createServiceClient();
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

interface Payload {
  title: string;
  body: string;
  url?: string;
}

async function sendOne(sub: StoredSub, payload: Payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    );
  } catch (e: any) {
    if (e?.statusCode === 404 || e?.statusCode === 410) await removeSubscription(sub.endpoint);
  }
}

/**
 * Daily nudge: tell each subscriber how many of today's matches still need
 * their prediction. Returns a summary.
 */
export async function notifyDue(): Promise<{ sent: number; configured: boolean }> {
  if (!ensureVapid()) return { sent: 0, configured: false };
  const [subs, matches, predictions] = await Promise.all([
    getAllSubscriptions(),
    getProvider().getMatches(),
    getAllPredictions(),
  ]);

  const now = Date.now();
  const soon = matches.filter(
    (m) => m.status === "upcoming" && new Date(m.kickoffAt).getTime() - now < 36 * 3600_000,
  );

  let sent = 0;
  for (const sub of subs) {
    const need = soon.filter(
      (m) => !predictions.some((p) => p.userId === sub.userId && p.matchId === m.id),
    ).length;
    if (need === 0) continue;
    await sendOne(sub, {
      title: "⚽ Lock in your picks",
      body: `${need} upcoming match${need > 1 ? "es need" : " needs"} your prediction.`,
      url: "/matches",
    });
    sent++;
  }
  return { sent, configured: true };
}

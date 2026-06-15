import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { saveSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "not signed in" }, { status: 401 });
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ ok: false, error: "bad subscription" }, { status: 400 });
  }
  await saveSubscription(userId, sub);
  return NextResponse.json({ ok: true });
}

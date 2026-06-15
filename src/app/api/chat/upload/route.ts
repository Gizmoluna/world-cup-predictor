import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSessionUserId } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Uploads a chat image to the public "chat" storage bucket; returns its URL.
export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "not signed in" }, { status: 401 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Image upload needs Supabase storage." }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "no file" }, { status: 400 });
  if (file.size > 6_000_000) return NextResponse.json({ ok: false, error: "Max 6MB" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const sb = createServiceClient();
  const { error } = await sb.storage.from("chat").upload(path, buf, {
    contentType: file.type || "image/png",
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const { data } = sb.storage.from("chat").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}

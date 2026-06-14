import { NextRequest, NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { recomputeScores } from "@/lib/sync";

export const dynamic = "force-dynamic";

async function handle(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await recomputeScores()) });
}

export const GET = handle;
export const POST = handle;

import "server-only";
import type { NextRequest } from "next/server";

/**
 * Guard for cron / sync endpoints. Allows the request when:
 *  - no CRON_SECRET is configured (open in local/demo), OR
 *  - the Authorization: Bearer <CRON_SECRET> header matches, OR
 *  - ?key=<CRON_SECRET> matches (handy for Vercel Cron / manual triggers).
 */
export function isCronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("key") === secret) return true;
  return false;
}

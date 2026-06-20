import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getUser } from "@/lib/data";
import { getReadModel } from "@/lib/aggregate";
import { rivalryBanter, aiConfigured } from "@/lib/ai";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

// AI rivalry banter — a one-line trash-talk based on the real head-to-head
// between the viewer and a rival. Returns {text} or 204 to hide the section.
export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!aiConfigured()) return new NextResponse(null, { status: 204 });

  const oppId = req.nextUrl.searchParams.get("opponentId");
  if (!oppId || oppId === userId) return NextResponse.json({ error: "bad opponent" }, { status: 400 });

  const [me, opp] = await Promise.all([getUser(userId), getUser(oppId)]);
  if (!me || !opp) return new NextResponse(null, { status: 204 });

  const model = await getReadModel({ restrictUserIds: [userId, oppId] });
  let myWins = 0, oppWins = 0, draws = 0, myPoints = 0, oppPoints = 0;
  for (const sm of model.scoredMatches) {
    if (sm.match.status !== "full_time") continue;
    const mine = sm.scores.find((s) => s.userId === userId);
    const theirs = sm.scores.find((s) => s.userId === oppId);
    if (!mine || !theirs) continue;
    myPoints += mine.totalPoints;
    oppPoints += theirs.totalPoints;
    if (mine.totalPoints > theirs.totalPoints) myWins++;
    else if (theirs.totalPoints > mine.totalPoints) oppWins++;
    else draws++;
  }

  const text = await rivalryBanter({
    cacheKey: `${userId}:${oppId}:${myWins}-${oppWins}-${draws}`,
    me: chrome(me).name,
    opp: chrome(opp).name,
    myWins,
    oppWins,
    draws,
    myPoints,
    oppPoints,
  });

  if (!text) return new NextResponse(null, { status: 204 });
  return NextResponse.json({ text });
}

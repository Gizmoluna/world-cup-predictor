import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getActiveLeague } from "@/lib/session";
import { getUser, getUserPredictions } from "@/lib/data";
import { getUserLeagues, getLeagueMembers } from "@/lib/leagues";

export const dynamic = "force-dynamic";

// Authenticated self-diagnostic: shows the CALLER their own league/prediction
// context only (no secret, no other users' private data) — so we can see why
// two players aren't seeing each other (almost always: not in the same active
// league, or no overlapping predicted matches).
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const me = await getUser(userId);
  const [leagues, active, myPreds] = await Promise.all([
    getUserLeagues(userId),
    getActiveLeague(userId),
    getUserPredictions(userId),
  ]);

  const leagueViews = await Promise.all(
    leagues.map(async (l) => {
      const members = await getLeagueMembers(l.id);
      return {
        id: l.id,
        name: l.name,
        inviteCode: l.inviteCode,
        isActive: l.id === active?.id,
        members: members.map((m) => ({ id: m.id, name: m.name })),
      };
    }),
  );

  // For the active league, show each member's predicted match ids so we can see
  // whether anyone has overlapping predictions to reveal/score.
  let activeLeagueMembers: { id: string; name: string; predictedMatchIds: string[] }[] = [];
  if (active) {
    const members = await getLeagueMembers(active.id);
    activeLeagueMembers = await Promise.all(
      members.map(async (m) => {
        const preds = await getUserPredictions(m.id);
        return { id: m.id, name: m.name, predictedMatchIds: preds.map((p) => p.matchId) };
      }),
    );
  }

  return NextResponse.json({
    ok: true,
    you: { id: userId, name: me?.name ?? userId },
    activeLeague: active ? { id: active.id, name: active.name } : null,
    yourLeagueCount: leagues.length,
    yourLeagues: leagueViews,
    yourPredictionCount: myPreds.length,
    yourPredictedMatchIds: myPreds.map((p) => p.matchId),
    activeLeagueMembers,
  });
}

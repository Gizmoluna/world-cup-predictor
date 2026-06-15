import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel, buildLeaderboard, type LeaderboardRow } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";
import { isSameMelbourneDay } from "@/lib/time";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

function serialize(rows: LeaderboardRow[]) {
  return rows.map((r) => ({
    userId: r.user.id,
    name: r.user.name,
    flag: chrome(r.user).flag,
    theme: r.user.theme,
    points: r.points,
    played: r.played,
    matchWins: r.matchWins,
    matchDraws: r.matchDraws,
    matchLosses: r.matchLosses,
    exactScores: r.exactScores,
    perfectPicks: r.perfectPicks,
    currentStreak: r.currentStreak,
    avgConfidenceAccuracy: r.avgConfidenceAccuracy,
    winnings: r.winnings,
  }));
}

export default async function LeaderboardPage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const model = await getReadModel({ restrictUserIds: members.map((m) => m.id) });

  const groupMatches = model.scoredMatches.filter((s) => s.match.stage === "group");
  const koMatches = model.scoredMatches.filter((s) => s.match.stage !== "group");
  const nowIso = new Date().toISOString();
  const todayMatches = model.scoredMatches.filter((s) =>
    isSameMelbourneDay(s.match.kickoffAt, nowIso),
  );

  const scopes = {
    overall: serialize(model.leaderboard),
    group: serialize(buildLeaderboard(model.users, groupMatches)),
    knockout: serialize(buildLeaderboard(model.users, koMatches)),
    daily: serialize(buildLeaderboard(model.users, todayMatches)),
  };

  return (
    <AppShell>
      <h1 className="title-bc mb-4 text-3xl">Leaderboard</h1>
      <LeaderboardTabs scopes={scopes} />
    </AppShell>
  );
}

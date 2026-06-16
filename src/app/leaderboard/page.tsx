import Link from "next/link";
import { requireUser, getActiveLeague } from "@/lib/session";
import {
  getReadModel,
  buildLeaderboard,
  getGlobalLeaderboard,
  type LeaderboardRow,
} from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";
import { ScoreBattle } from "@/components/score-battle";
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
  const model = await getReadModel(league ? { leagueId: league.id } : { restrictUserIds: [user.id] });

  const groupMatches = model.scoredMatches.filter((s) => s.match.stage === "group");
  const koMatches = model.scoredMatches.filter((s) => s.match.stage !== "group");
  const nowIso = new Date().toISOString();
  const todayMatches = model.scoredMatches.filter((s) =>
    isSameMelbourneDay(s.match.kickoffAt, nowIso),
  );

  // Global = everyone across all leagues — cached + capped so it scales.
  const global = await getGlobalLeaderboard(user.id);

  const scopes = {
    overall: serialize(model.leaderboard),
    group: serialize(buildLeaderboard(model.users, groupMatches, model.eligibleFrom)),
    knockout: serialize(buildLeaderboard(model.users, koMatches, model.eligibleFrom)),
    daily: serialize(buildLeaderboard(model.users, todayMatches, model.eligibleFrom)),
    global: global.rows,
  };

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="title-bc text-3xl">Leaderboard</h1>
        <Link href="/how-it-works" className="text-xs font-bold text-[var(--accent)]">
          How scoring works →
        </Link>
      </div>
      {model.leaderboard.length > 1 && (
        <div className="mb-4">
          <ScoreBattle rows={model.leaderboard} />
        </div>
      )}
      <LeaderboardTabs
        scopes={scopes}
        currentUserId={user.id}
        globalMeta={{
          totalPlayers: global.totalPlayers,
          cap: global.rows.length,
          viewerRank: global.viewerRank,
          viewerRow: global.viewerRow,
        }}
      />
    </AppShell>
  );
}

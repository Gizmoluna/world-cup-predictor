// ---------------------------------------------------------------------------
// Sync + scoring jobs. Called by the /api/sync/* and /api/score routes (and by
// the cron schedule). When Supabase is configured, results are persisted;
// otherwise the provider is already live per-request so these act as no-ops
// that simply report what they'd do.
// ---------------------------------------------------------------------------

import "server-only";
import { getProvider } from "@/lib/football-api/provider";
import { getReadModel } from "@/lib/aggregate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";
import type { Match, Team } from "@/lib/types";

export async function syncFixtures() {
  const provider = getProvider();
  const [teams, matches] = await Promise.all([provider.getTeams(), provider.getMatches()]);
  if (isSupabaseConfigured()) {
    const sb = createServiceClient();
    await sb.from("teams").upsert(teams.map(teamRow), { onConflict: "id" });
    await sb.from("matches").upsert(matches.map(matchRow), { onConflict: "id" });
  }
  return { provider: provider.name, teams: teams.length, matches: matches.length };
}

export async function syncLive() {
  const provider = getProvider();
  const matches = (await provider.getMatches()).filter((m) => m.status === "live");
  if (isSupabaseConfigured() && matches.length) {
    const sb = createServiceClient();
    await sb.from("matches").upsert(matches.map(matchRow), { onConflict: "id" });
  }
  return { live: matches.length, matchIds: matches.map((m) => m.id) };
}

export async function syncStandings() {
  const standings = await getProvider().getStandings();
  return { standings: standings.length };
}

export async function syncNews() {
  const news = await getProvider().getNews();
  return { news: news.length };
}

/** Recompute scores for every finished match; persist to prediction_scores. */
export async function recomputeScores() {
  const model = await getReadModel();
  const allScores = [...model.scoresByMatch.values()].flat();
  if (isSupabaseConfigured() && allScores.length) {
    const sb = createServiceClient();
    await sb.from("prediction_scores").upsert(
      allScores.map((s) => ({
        user_id: s.userId,
        match_id: s.matchId,
        exact_score_points: s.exactScorePoints,
        result_points: s.resultPoints,
        goal_difference_points: s.goalDifferencePoints,
        total_goals_points: s.totalGoalsPoints,
        first_team_score_points: s.firstTeamScorePoints,
        btts_points: s.bttsPoints,
        clean_sheet_points: s.cleanSheetPoints,
        first_goal_scorer_points: s.firstGoalScorerPoints,
        anytime_goal_scorer_points: s.anytimeGoalScorerPoints,
        player_of_match_points: s.playerOfMatchPoints,
        card_points: s.cardPoints,
        penalty_points: s.penaltyPoints,
        shootout_points: s.shootoutPoints,
        bonus_points: s.bonusPoints,
        multiplier: s.multiplier,
        total_points: s.totalPoints,
        calculated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,match_id" },
    );
  }
  return {
    scoredMatches: model.scoredMatches.length,
    scoreRows: allScores.length,
    leaderboard: model.leaderboard.map((r) => ({ user: r.user.id, points: r.points })),
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function teamRow(t: Team): any {
  return {
    id: t.id,
    api_team_id: t.apiTeamId ?? null,
    name: t.name,
    short_name: t.shortName,
    flag_url: t.flagUrl,
    group_name: t.groupName ?? null,
    confederation: t.confederation ?? null,
  };
}

function matchRow(m: Match): any {
  return {
    id: m.id,
    api_fixture_id: m.apiFixtureId ?? null,
    home_team_id: m.homeTeamId,
    away_team_id: m.awayTeamId,
    kickoff_at: m.kickoffAt,
    venue: m.venue ?? null,
    stage: m.stage,
    group_name: m.groupName ?? null,
    status: m.status,
    home_score: m.homeScore,
    away_score: m.awayScore,
    winner_team_id: m.winnerTeamId ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

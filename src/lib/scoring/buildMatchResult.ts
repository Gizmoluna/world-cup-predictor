// ---------------------------------------------------------------------------
// buildMatchResult — derive the full MatchResult truth object from a finished
// Match plus its ordered MatchEvents. Pure & testable.
// ---------------------------------------------------------------------------

import type { Match, MatchEvent, MatchResult } from "@/lib/types";

const GOAL_TYPES = new Set(["goal", "penalty_goal"]);

export function buildMatchResult(
  match: Match,
  events: MatchEvent[],
  favouriteTeamId?: string | null,
): MatchResult {
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;

  // Sort events chronologically (nulls last) for "first" derivations.
  const sorted = [...events].sort(
    (a, b) => (a.minute ?? 9999) - (b.minute ?? 9999),
  );

  const goals = sorted.filter((e) => GOAL_TYPES.has(e.type) || e.type === "own_goal");

  // First team to score: own goals count for the *opponent*.
  let firstTeamToScoreId: string | null = null;
  const firstGoal = goals[0];
  if (firstGoal) {
    if (firstGoal.type === "own_goal") {
      firstTeamToScoreId =
        firstGoal.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    } else {
      firstTeamToScoreId = firstGoal.teamId;
    }
  } else if (homeScore === 0 && awayScore === 0) {
    // Goalless — "No goals" is the correct first-to-score pick.
    firstTeamToScoreId = "none";
  }
  // (goals happened but no event detail → leave null; can't infer reliably)

  const bothTeamsToScore = homeScore > 0 && awayScore > 0;

  let cleanSheetTeamId: string | null = null;
  if (awayScore === 0 && homeScore > 0) cleanSheetTeamId = match.homeTeamId;
  else if (homeScore === 0 && awayScore > 0) cleanSheetTeamId = match.awayTeamId;
  else if (homeScore > 0 && awayScore > 0) cleanSheetTeamId = "none"; // both scored → "Neither"

  // First goal scorer: first non-own-goal scorer with a known player.
  const firstScorerEvent = goals.find(
    (e) => e.type !== "own_goal" && e.playerId,
  );
  const firstGoalScorerId = firstScorerEvent?.playerId ?? null;

  const goalScorerIds = Array.from(
    new Set(
      goals
        .filter((e) => GOAL_TYPES.has(e.type) && e.playerId)
        .map((e) => e.playerId as string),
    ),
  );

  const yellowCardPlayerIds = Array.from(
    new Set(
      sorted
        .filter((e) => e.type === "yellow_card" && e.playerId)
        .map((e) => e.playerId as string),
    ),
  );

  const redCardOccurred = sorted.some((e) => e.type === "red_card");
  const penaltyAwarded = sorted.some(
    (e) => e.type === "penalty_goal" || e.type === "penalty_missed",
  );
  const varDrama = sorted.some((e) => e.type === "var");

  const playerOfMatchEvent = sorted.find((e) => e.description === "player_of_match");
  const playerOfMatchId = playerOfMatchEvent?.playerId ?? null;

  let winnerTeamId: string | null = match.winnerTeamId ?? null;
  if (!winnerTeamId) {
    if (homeScore > awayScore) winnerTeamId = match.homeTeamId;
    else if (awayScore > homeScore) winnerTeamId = match.awayTeamId;
    else if (match.shootoutWinnerTeamId) winnerTeamId = match.shootoutWinnerTeamId;
    else winnerTeamId = null;
  }

  return {
    matchId: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore,
    awayScore,
    htHomeScore: match.htHomeScore ?? null,
    htAwayScore: match.htAwayScore ?? null,
    firstTeamToScoreId,
    bothTeamsToScore,
    cleanSheetTeamId,
    firstGoalScorerId,
    goalScorerIds,
    playerOfMatchId,
    yellowCardPlayerIds,
    redCardOccurred,
    penaltyAwarded,
    varDrama,
    extraTime: Boolean(match.extraTime),
    shootout: Boolean(match.shootout),
    shootoutWinnerTeamId: match.shootoutWinnerTeamId ?? null,
    winnerTeamId,
    favouriteTeamId: favouriteTeamId ?? null,
  };
}

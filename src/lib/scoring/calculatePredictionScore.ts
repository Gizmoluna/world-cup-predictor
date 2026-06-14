// ---------------------------------------------------------------------------
// calculatePredictionScore — the prediction engine.
//
// Pure function: (MatchResult, Prediction) -> PredictionScore.
// No I/O, no dates-from-now, no randomness. Fully unit-testable.
// ---------------------------------------------------------------------------

import type { MatchResult, Prediction, PredictionScore } from "@/lib/types";
import { POINTS, type PointsConfig } from "./points";

/** Who the prediction expects to win: a teamId, or "draw". */
function predictedOutcome(p: Prediction): string | "draw" | null {
  if (p.predictedWinnerTeamId) return p.predictedWinnerTeamId;
  // Derive from the predicted scoreline if no explicit winner was set.
  if (p.predictedHomeScore == null || p.predictedAwayScore == null) return null;
  if (p.predictedHomeScore > p.predictedAwayScore) return "home";
  if (p.predictedHomeScore < p.predictedAwayScore) return "away";
  return "draw";
}

/** The actual outcome expressed the same way as predictedOutcome. */
function actualOutcome(r: MatchResult): string | "draw" {
  if (r.winnerTeamId) return r.winnerTeamId;
  if (r.homeScore > r.awayScore) return "home";
  if (r.homeScore < r.awayScore) return "away";
  return "draw";
}

/** Normalise a "home"/"away"/teamId/draw token to a concrete teamId or "draw". */
function resolveSide(
  token: string | "draw" | null,
  homeTeamId: string,
  awayTeamId: string,
): string | "draw" | null {
  if (token == null) return null;
  if (token === "home") return homeTeamId;
  if (token === "away") return awayTeamId;
  return token; // already a teamId or "draw"
}

export function calculatePredictionScore(
  result: MatchResult,
  prediction: Prediction,
  config: PointsConfig = POINTS,
): PredictionScore {
  const badges: string[] = [];

  const has = (v: unknown) => v !== null && v !== undefined;

  // --- Scoreline-derived categories -------------------------------------
  const exactScore =
    has(prediction.predictedHomeScore) &&
    has(prediction.predictedAwayScore) &&
    prediction.predictedHomeScore === result.homeScore &&
    prediction.predictedAwayScore === result.awayScore;
  const exactScorePoints = exactScore ? config.exactScore : 0;

  const predOutcome = resolveSide(
    predictedOutcome(prediction),
    result.homeTeamId,
    result.awayTeamId,
  );
  const realOutcome = resolveSide(
    actualOutcome(result),
    result.homeTeamId,
    result.awayTeamId,
  );
  const resultCorrect = has(predOutcome) && predOutcome === realOutcome;
  const resultPoints = resultCorrect ? config.correctResult : 0;

  let goalDifferencePoints = 0;
  let totalGoalsPoints = 0;
  if (has(prediction.predictedHomeScore) && has(prediction.predictedAwayScore)) {
    const predGd = prediction.predictedHomeScore! - prediction.predictedAwayScore!;
    const realGd = result.homeScore - result.awayScore;
    if (predGd === realGd) goalDifferencePoints = config.goalDifference;

    const predTotal = prediction.predictedHomeScore! + prediction.predictedAwayScore!;
    const realTotal = result.homeScore + result.awayScore;
    if (predTotal === realTotal) totalGoalsPoints = config.totalGoals;
  }

  // --- First team to score ----------------------------------------------
  let firstTeamScorePoints = 0;
  if (has(prediction.firstTeamToScoreId)) {
    const pred = resolveSide(
      prediction.firstTeamToScoreId!,
      result.homeTeamId,
      result.awayTeamId,
    );
    if (pred === result.firstTeamToScoreId) {
      firstTeamScorePoints = config.firstTeamToScore;
    }
  }

  // --- Both teams to score ----------------------------------------------
  let bttsPoints = 0;
  if (has(prediction.bothTeamsToScore)) {
    if (prediction.bothTeamsToScore === result.bothTeamsToScore) {
      bttsPoints = config.bothTeamsToScore;
    }
  }

  // --- Clean sheet -------------------------------------------------------
  let cleanSheetPoints = 0;
  if (has(prediction.cleanSheetTeamId)) {
    const pred = resolveSide(
      prediction.cleanSheetTeamId!,
      result.homeTeamId,
      result.awayTeamId,
    );
    if (pred === result.cleanSheetTeamId) {
      cleanSheetPoints = config.cleanSheet;
    }
  }

  // --- Goal scorers ------------------------------------------------------
  let firstGoalScorerPoints = 0;
  const firstScorerCorrect =
    has(prediction.firstGoalScorerId) &&
    prediction.firstGoalScorerId === result.firstGoalScorerId;
  if (firstScorerCorrect) firstGoalScorerPoints = config.firstGoalScorer;

  let anytimeGoalScorerPoints = 0;
  if (
    has(prediction.anytimeGoalScorerId) &&
    result.goalScorerIds.includes(prediction.anytimeGoalScorerId!)
  ) {
    anytimeGoalScorerPoints = config.anytimeGoalScorer;
  }

  // --- Player of the match ----------------------------------------------
  let playerOfMatchPoints = 0;
  if (
    has(prediction.playerOfMatchId) &&
    prediction.playerOfMatchId === result.playerOfMatchId
  ) {
    playerOfMatchPoints = config.playerOfMatch;
  }

  // --- Cards (yellow specific player + red occurred) --------------------
  let cardPoints = 0;
  if (
    has(prediction.yellowCardPlayerId) &&
    result.yellowCardPlayerIds.includes(prediction.yellowCardPlayerId!)
  ) {
    cardPoints += config.yellowCardPlayer;
  }
  if (has(prediction.redCardExpected)) {
    if (prediction.redCardExpected === result.redCardOccurred) {
      cardPoints += config.redCard;
    }
  }

  // --- Penalty / VAR / extra time ---------------------------------------
  let penaltyPoints = 0;
  if (has(prediction.penaltyExpected)) {
    if (prediction.penaltyExpected === result.penaltyAwarded) {
      penaltyPoints += config.penalty;
    }
  }

  let bonusPoints = 0;
  if (has(prediction.varDramaExpected) && prediction.varDramaExpected === result.varDrama) {
    bonusPoints += config.varDrama;
  }
  if (has(prediction.extraTimeExpected) && prediction.extraTimeExpected === result.extraTime) {
    bonusPoints += config.extraTime;
  }

  // --- Shootout ----------------------------------------------------------
  let shootoutPoints = 0;
  if (result.shootout && has(prediction.shootoutWinnerTeamId)) {
    const pred = resolveSide(
      prediction.shootoutWinnerTeamId!,
      result.homeTeamId,
      result.awayTeamId,
    );
    if (pred === result.shootoutWinnerTeamId) {
      shootoutPoints = config.shootoutWinner;
    }
  }

  // --- Bonuses & badges --------------------------------------------------
  if (exactScore && firstScorerCorrect) {
    bonusPoints += config.perfectPredictionBonus;
    badges.push("psychic_mode");
    badges.push("perfect_prediction");
  } else if (exactScore) {
    badges.push("exact_score");
  }

  // Underdog: user flagged an upset AND the team they backed (not the
  // favourite) actually won.
  if (
    prediction.upsetAlert &&
    resultCorrect &&
    realOutcome !== "draw" &&
    has(result.favouriteTeamId) &&
    realOutcome !== result.favouriteTeamId &&
    predOutcome === realOutcome
  ) {
    bonusPoints += config.underdogBonus;
    badges.push("upset_caller");
  }

  // --- Totals ------------------------------------------------------------
  const subtotal =
    exactScorePoints +
    resultPoints +
    goalDifferencePoints +
    totalGoalsPoints +
    firstTeamScorePoints +
    bttsPoints +
    cleanSheetPoints +
    firstGoalScorerPoints +
    anytimeGoalScorerPoints +
    playerOfMatchPoints +
    cardPoints +
    penaltyPoints +
    shootoutPoints +
    bonusPoints;

  const multiplier = prediction.confidenceMultiplier ?? 1;
  const totalPoints = subtotal * multiplier;

  if (multiplier > 1 && subtotal > 0) badges.push("confidence_king");
  if (subtotal === 0) badges.push("bottled_it");

  return {
    predictionId: prediction.id,
    userId: prediction.userId,
    matchId: prediction.matchId,
    exactScorePoints,
    resultPoints,
    goalDifferencePoints,
    totalGoalsPoints,
    firstTeamScorePoints,
    bttsPoints,
    cleanSheetPoints,
    firstGoalScorerPoints,
    anytimeGoalScorerPoints,
    playerOfMatchPoints,
    cardPoints,
    penaltyPoints,
    shootoutPoints,
    bonusPoints,
    multiplier,
    subtotal,
    totalPoints,
    badges,
  };
}

/**
 * Decide the head-to-head winner of a single match between two scored
 * predictions. Returns the winning userId, or null for a tie.
 */
export function headToHeadWinner(
  a: PredictionScore,
  b: PredictionScore,
): string | null {
  if (a.totalPoints > b.totalPoints) return a.userId;
  if (b.totalPoints > a.totalPoints) return b.userId;
  return null;
}

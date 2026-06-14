// ---------------------------------------------------------------------------
// Scoring configuration — single source of truth for point values.
// Tweak here; the engine and the UI both read from this object.
// ---------------------------------------------------------------------------

export const POINTS = {
  exactScore: 5,
  correctResult: 2,
  goalDifference: 1,
  totalGoals: 1,
  firstTeamToScore: 1,
  bothTeamsToScore: 1,
  cleanSheet: 1,
  firstGoalScorer: 4,
  anytimeGoalScorer: 2,
  playerOfMatch: 3,
  yellowCardPlayer: 1,
  redCard: 3,
  penalty: 2,
  varDrama: 1,
  extraTime: 1,
  shootoutWinner: 3,
  // bonuses (added to subtotal, then multiplied)
  perfectPredictionBonus: 3, // exact score + first goal scorer
  underdogBonus: 3, // correctly called a predicted upset
} as const;

export type PointsConfig = typeof POINTS;

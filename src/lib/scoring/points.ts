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
  // futures
  groupWinner: 10, // correctly predicted a group winner
  knockoutWinner: 8, // correctly predicted a knockout match winner
  winMethod: 4, // correctly predicted 90' / ET / penalties
  // Changing a futures pick costs points, escalating each time you flip-flop.
  // The cost of the k-th change is changeFirst + (k-1) * changeStep.
  // First change is cheap; conviction is rewarded, dithering is punished.
  changeFirst: 1, // cost of the very first change to a pick
  changeStep: 2, // how much each further change adds
  // (legacy alias, kept so older references resolve)
  changePenalty: 2,
} as const;

export type PointsConfig = typeof POINTS;

/**
 * Cost of the `level`-th change to a futures pick (level 1 = first change).
 * Escalates: 1, 3, 5, 7, ... with the defaults above.
 */
export function changeCost(level: number): number {
  if (level < 1) return 0;
  return POINTS.changeFirst + (level - 1) * POINTS.changeStep;
}

/**
 * Penalty for a single change at a given escalation `level`, scaled by how big
 * the edit was. `magnitude` is 0..1 (1 = wholesale change). A tiny tweak — e.g.
 * swapping two teams in a group order — costs proportionally less. Always at
 * least 1 point for any real change, so flipping is never entirely free.
 */
export function changePenaltyFor(level: number, magnitude = 1): number {
  if (level < 1 || magnitude <= 0) return 0;
  const raw = changeCost(level) * Math.max(0, Math.min(1, magnitude));
  return Math.max(1, Math.round(raw));
}

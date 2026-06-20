// ---------------------------------------------------------------------------
// Live (provisional) scoring — score predictions against a match *as it stands*
// right now (current score + events so far), not just at full-time. Powers the
// Live Match Center's "who's winning this match" board, with points that tick
// up as goals go in. Pure: reuses the same scoring engine as the final result.
// ---------------------------------------------------------------------------

import type { Match, MatchEvent, Prediction, PredictionScore } from "@/lib/types";
import { buildMatchResult } from "@/lib/scoring/buildMatchResult";
import { calculatePredictionScore } from "@/lib/scoring/calculatePredictionScore";

export interface LiveStanding {
  userId: string;
  score: PredictionScore;
  /** Plain-English hits the player has already banked, e.g. "First scorer ✓". */
  hits: string[];
}

/** What's already correct for this prediction at the current match state. */
function hitsFor(s: PredictionScore): string[] {
  const out: string[] = [];
  if (s.exactScorePoints > 0) out.push("Exact score ✓");
  else if (s.resultPoints > 0) out.push("Result ✓");
  if (s.firstGoalScorerPoints > 0) out.push("First scorer ✓");
  if (s.anytimeGoalScorerPoints > 0) out.push("Goalscorer ✓");
  if (s.firstTeamScorePoints > 0) out.push("First to score ✓");
  if (s.bttsPoints > 0) out.push("BTTS ✓");
  return out;
}

/**
 * Provisional standings for everyone who predicted this match, ranked by points
 * they'd have *if the match ended now*. `favByUser` feeds the underdog bonus.
 */
export function liveStandings(
  match: Match,
  events: MatchEvent[],
  predictions: Prediction[],
  favByUser?: Map<string, string | null>,
): LiveStanding[] {
  return predictions
    .map((p) => {
      const result = buildMatchResult(match, events, favByUser?.get(p.userId) ?? null);
      const score = calculatePredictionScore(result, p);
      return { userId: p.userId, score, hits: hitsFor(score) };
    })
    .sort((a, b) => b.score.totalPoints - a.score.totalPoints);
}

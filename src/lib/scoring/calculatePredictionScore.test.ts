import { describe, it, expect } from "vitest";
import { calculatePredictionScore, headToHeadWinner } from "./calculatePredictionScore";
import { buildMatchResult } from "./buildMatchResult";
import { POINTS } from "./points";
import type { Match, MatchEvent, MatchResult, Prediction } from "@/lib/types";

const HOME = "team_home";
const AWAY = "team_away";

function baseResult(over: Partial<MatchResult> = {}): MatchResult {
  return {
    matchId: "m1",
    homeTeamId: HOME,
    awayTeamId: AWAY,
    homeScore: 2,
    awayScore: 1,
    htHomeScore: 1,
    htAwayScore: 0,
    firstTeamToScoreId: HOME,
    bothTeamsToScore: true,
    cleanSheetTeamId: null,
    firstGoalScorerId: "p_home_1",
    goalScorerIds: ["p_home_1", "p_home_2", "p_away_1"],
    playerOfMatchId: "p_home_1",
    yellowCardPlayerIds: ["p_away_3"],
    redCardOccurred: false,
    penaltyAwarded: false,
    varDrama: false,
    extraTime: false,
    shootout: false,
    shootoutWinnerTeamId: null,
    winnerTeamId: HOME,
    favouriteTeamId: HOME,
    ...over,
  };
}

function basePrediction(over: Partial<Prediction> = {}): Prediction {
  return {
    userId: "carina",
    matchId: "m1",
    predictedHomeScore: null,
    predictedAwayScore: null,
    ...over,
  };
}

describe("calculatePredictionScore — scoreline categories", () => {
  it("awards exact score, result, GD and total goals when scoreline is perfect", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ predictedHomeScore: 2, predictedAwayScore: 1 }),
    );
    expect(score.exactScorePoints).toBe(POINTS.exactScore);
    expect(score.resultPoints).toBe(POINTS.correctResult);
    expect(score.goalDifferencePoints).toBe(POINTS.goalDifference);
    expect(score.totalGoalsPoints).toBe(POINTS.totalGoals);
    expect(score.subtotal).toBe(
      POINTS.exactScore + POINTS.correctResult + POINTS.goalDifference + POINTS.totalGoals,
    );
  });

  it("awards result + GD but not exact when result right, scoreline off but GD same", () => {
    // predicted 3-2, actual 2-1: same result (home win), same GD (+1), diff total
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ predictedHomeScore: 3, predictedAwayScore: 2 }),
    );
    expect(score.exactScorePoints).toBe(0);
    expect(score.resultPoints).toBe(POINTS.correctResult);
    expect(score.goalDifferencePoints).toBe(POINTS.goalDifference);
    expect(score.totalGoalsPoints).toBe(0);
  });

  it("awards total goals even when result is wrong", () => {
    // predicted 1-2 (away win), actual 2-1 (home win): total 3 matches, result wrong
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ predictedHomeScore: 1, predictedAwayScore: 2 }),
    );
    expect(score.resultPoints).toBe(0);
    expect(score.totalGoalsPoints).toBe(POINTS.totalGoals);
    expect(score.goalDifferencePoints).toBe(0);
  });

  it("scores a correct draw prediction", () => {
    const r = baseResult({ homeScore: 1, awayScore: 1, winnerTeamId: null, cleanSheetTeamId: null });
    const score = calculatePredictionScore(
      r,
      basePrediction({ predictedHomeScore: 1, predictedAwayScore: 1 }),
    );
    expect(score.resultPoints).toBe(POINTS.correctResult);
    expect(score.exactScorePoints).toBe(POINTS.exactScore);
  });
});

describe("calculatePredictionScore — markets", () => {
  it("scores first team to score with home/away tokens", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ firstTeamToScoreId: "home" }),
    );
    expect(score.firstTeamScorePoints).toBe(POINTS.firstTeamToScore);
  });

  it("scores BTTS correctly and rewards a correct 'no'", () => {
    const yes = calculatePredictionScore(baseResult(), basePrediction({ bothTeamsToScore: true }));
    expect(yes.bttsPoints).toBe(POINTS.bothTeamsToScore);

    const r = baseResult({ awayScore: 0, bothTeamsToScore: false, cleanSheetTeamId: HOME });
    const no = calculatePredictionScore(r, basePrediction({ bothTeamsToScore: false }));
    expect(no.bttsPoints).toBe(POINTS.bothTeamsToScore);
  });

  it("scores clean sheet", () => {
    const r = baseResult({ awayScore: 0, bothTeamsToScore: false, cleanSheetTeamId: HOME });
    const score = calculatePredictionScore(r, basePrediction({ cleanSheetTeamId: "home" }));
    expect(score.cleanSheetPoints).toBe(POINTS.cleanSheet);
  });

  it("'Neither' clean-sheet pick scores when both teams scored", () => {
    // buildMatchResult emits cleanSheetTeamId 'none' for a both-scored game.
    const r = baseResult({ cleanSheetTeamId: "none" });
    const score = calculatePredictionScore(r, basePrediction({ cleanSheetTeamId: "none" }));
    expect(score.cleanSheetPoints).toBe(POINTS.cleanSheet);
  });

  it("'No goals' first-to-score pick scores on a 0-0", () => {
    const r = baseResult({ homeScore: 0, awayScore: 0, firstTeamToScoreId: "none", bothTeamsToScore: false });
    const score = calculatePredictionScore(r, basePrediction({ firstTeamToScoreId: "none" }));
    expect(score.firstTeamScorePoints).toBe(POINTS.firstTeamToScore);
  });

  it("scores first goal scorer and anytime scorer", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ firstGoalScorerId: "p_home_1", anytimeGoalScorerId: "p_away_1" }),
    );
    expect(score.firstGoalScorerPoints).toBe(POINTS.firstGoalScorer);
    expect(score.anytimeGoalScorerPoints).toBe(POINTS.anytimeGoalScorer);
  });

  it("does not award anytime scorer for a player who didn't score", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ anytimeGoalScorerId: "nobody" }),
    );
    expect(score.anytimeGoalScorerPoints).toBe(0);
  });

  it("scores player of the match", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ playerOfMatchId: "p_home_1" }),
    );
    expect(score.playerOfMatchPoints).toBe(POINTS.playerOfMatch);
  });

  it("scores cards: yellow player + red card expectation", () => {
    const score = calculatePredictionScore(
      baseResult({ redCardOccurred: true }),
      basePrediction({ yellowCardPlayerId: "p_away_3", redCardExpected: true }),
    );
    expect(score.cardPoints).toBe(POINTS.yellowCardPlayer + POINTS.redCard);
  });

  it("rewards correctly predicting NO red card", () => {
    const score = calculatePredictionScore(
      baseResult({ redCardOccurred: false }),
      basePrediction({ redCardExpected: false }),
    );
    expect(score.cardPoints).toBe(POINTS.redCard);
  });

  it("scores penalty / var / extra time", () => {
    const r = baseResult({ penaltyAwarded: true, varDrama: true, extraTime: true });
    const score = calculatePredictionScore(
      r,
      basePrediction({ penaltyExpected: true, varDramaExpected: true, extraTimeExpected: true }),
    );
    expect(score.penaltyPoints).toBe(POINTS.penalty);
    expect(score.bonusPoints).toBeGreaterThanOrEqual(POINTS.varDrama + POINTS.extraTime);
  });

  it("scores shootout winner only when a shootout happened", () => {
    const noShootout = calculatePredictionScore(
      baseResult(),
      basePrediction({ shootoutWinnerTeamId: "home" }),
    );
    expect(noShootout.shootoutPoints).toBe(0);

    const r = baseResult({ shootout: true, shootoutWinnerTeamId: AWAY });
    const yes = calculatePredictionScore(r, basePrediction({ shootoutWinnerTeamId: "away" }));
    expect(yes.shootoutPoints).toBe(POINTS.shootoutWinner);
  });
});

describe("calculatePredictionScore — bonuses, multiplier & badges", () => {
  it("applies the confidence multiplier to the subtotal", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ predictedHomeScore: 2, predictedAwayScore: 1, confidenceMultiplier: 3 }),
    );
    expect(score.totalPoints).toBe(score.subtotal * 3);
    expect(score.badges).toContain("confidence_king");
  });

  it("awards the perfect-prediction bonus + psychic badge", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        firstGoalScorerId: "p_home_1",
      }),
    );
    expect(score.badges).toContain("psychic_mode");
    expect(score.bonusPoints).toBeGreaterThanOrEqual(POINTS.perfectPredictionBonus);
  });

  it("awards the underdog bonus when an upset call lands", () => {
    // favourite is HOME, but AWAY wins and the user flagged the upset & backed AWAY
    const r = baseResult({
      homeScore: 0,
      awayScore: 2,
      winnerTeamId: AWAY,
      firstTeamToScoreId: AWAY,
      bothTeamsToScore: false,
      cleanSheetTeamId: AWAY,
      firstGoalScorerId: "p_away_1",
      favouriteTeamId: HOME,
    });
    const score = calculatePredictionScore(
      r,
      basePrediction({ predictedWinnerTeamId: AWAY, upsetAlert: true }),
    );
    expect(score.badges).toContain("upset_caller");
    expect(score.bonusPoints).toBeGreaterThanOrEqual(POINTS.underdogBonus);
  });

  it("flags bottled_it when nothing scores", () => {
    const score = calculatePredictionScore(
      baseResult(),
      basePrediction({ predictedHomeScore: 0, predictedAwayScore: 5 }),
    );
    expect(score.totalPoints).toBe(0);
    expect(score.badges).toContain("bottled_it");
  });
});

describe("headToHeadWinner", () => {
  it("picks the higher scorer and ties on equal points", () => {
    const a = calculatePredictionScore(
      baseResult(),
      basePrediction({ userId: "carina", predictedHomeScore: 2, predictedAwayScore: 1 }),
    );
    const b = calculatePredictionScore(
      baseResult(),
      basePrediction({ userId: "johnny", predictedHomeScore: 5, predictedAwayScore: 5 }),
    );
    expect(headToHeadWinner(a, b)).toBe("carina");
    expect(headToHeadWinner(a, a)).toBeNull();
  });
});

describe("buildMatchResult", () => {
  const match: Match = {
    id: "m1",
    homeTeamId: HOME,
    awayTeamId: AWAY,
    kickoffAt: "2026-06-14T10:00:00Z",
    stage: "group",
    status: "full_time",
    homeScore: 2,
    awayScore: 1,
  };

  it("derives first scorer, btts, clean sheet and card flags from events", () => {
    const events: MatchEvent[] = [
      { id: "e1", matchId: "m1", minute: 12, type: "goal", teamId: HOME, playerId: "p_home_1" },
      { id: "e2", matchId: "m1", minute: 40, type: "yellow_card", teamId: AWAY, playerId: "p_away_3" },
      { id: "e3", matchId: "m1", minute: 55, type: "goal", teamId: AWAY, playerId: "p_away_1" },
      { id: "e4", matchId: "m1", minute: 70, type: "goal", teamId: HOME, playerId: "p_home_2" },
    ];
    const r = buildMatchResult(match, events, HOME);
    expect(r.firstTeamToScoreId).toBe(HOME);
    expect(r.firstGoalScorerId).toBe("p_home_1");
    expect(r.goalScorerIds).toEqual(["p_home_1", "p_away_1", "p_home_2"]);
    expect(r.bothTeamsToScore).toBe(true);
    expect(r.cleanSheetTeamId).toBe("none"); // both scored → "Neither" is correct
    expect(r.yellowCardPlayerIds).toContain("p_away_3");
    expect(r.winnerTeamId).toBe(HOME);
  });

  it("attributes an own goal to the opponent for first-team-to-score", () => {
    const events: MatchEvent[] = [
      { id: "e1", matchId: "m1", minute: 5, type: "own_goal", teamId: AWAY, playerId: "p_away_5" },
    ];
    const r = buildMatchResult({ ...match, homeScore: 1, awayScore: 0 }, events, HOME);
    expect(r.firstTeamToScoreId).toBe(HOME);
    expect(r.firstGoalScorerId).toBeNull(); // own goals aren't a "scorer"
  });
});

import { describe, it, expect } from "vitest";
import { buildLeaderboard, type ScoredMatch } from "./leaderboard";
import type { AppUser, Match, PredictionScore } from "@/lib/types";

function user(id: string): AppUser {
  return { id, name: id, theme: "gold" };
}

function match(id: string, kickoffAt: string): Match {
  return {
    id,
    homeTeamId: "h",
    awayTeamId: "a",
    kickoffAt,
    status: "full_time",
    stage: "group",
  } as Match;
}

// Minimal score with overridable points; defaults to a clean miss.
function score(userId: string, over: Partial<PredictionScore> = {}): PredictionScore {
  return {
    predictionId: `${userId}-p`,
    userId,
    matchId: "m",
    exactScorePoints: 0,
    resultPoints: 0,
    goalDifferencePoints: 0,
    totalGoalsPoints: 0,
    firstTeamScorePoints: 0,
    bttsPoints: 0,
    cleanSheetPoints: 0,
    firstGoalScorerPoints: 0,
    anytimeGoalScorerPoints: 0,
    playerOfMatchPoints: 0,
    cardPoints: 0,
    penaltyPoints: 0,
    shootoutPoints: 0,
    bonusPoints: 0,
    multiplier: 1,
    subtotal: 0,
    totalPoints: 0,
    wagerAmount: 0,
    wagerProfit: 0,
    badges: [],
    ...over,
  };
}

const A = user("a");
const B = user("b");

function scored(id: string, kickoff: string, scores: PredictionScore[], winnerUserId: string | null): ScoredMatch {
  return { match: match(id, kickoff), scores, winnerUserId };
}

describe("buildLeaderboard — basics", () => {
  it("sums points and ranks descending", () => {
    const board = buildLeaderboard(
      [A, B],
      [
        scored("m1", "2026-06-01T00:00:00Z", [score("a", { totalPoints: 5, exactScorePoints: 5 }), score("b", { totalPoints: 2 })], "a"),
      ],
    );
    expect(board[0].user.id).toBe("a");
    expect(board[0].points).toBe(5);
    expect(board[0].exactScores).toBe(1);
    expect(board[0].matchWins).toBe(1);
    expect(board[1].points).toBe(2);
    expect(board[1].matchLosses).toBe(1);
  });

  it("tracks win/loss streaks chronologically (not by input order)", () => {
    const board = buildLeaderboard(
      [A],
      [
        scored("m2", "2026-06-03T00:00:00Z", [score("a", { totalPoints: 1 })], "a"),
        scored("m1", "2026-06-01T00:00:00Z", [score("a", { totalPoints: 1 })], "a"),
        scored("m3", "2026-06-05T00:00:00Z", [score("a", { totalPoints: 1 })], "a"),
      ],
    );
    expect(board[0].currentStreak).toBe(3); // three wins in a row
  });

  it("a loss after wins flips the streak to -1", () => {
    const board = buildLeaderboard(
      [A],
      [
        scored("m1", "2026-06-01T00:00:00Z", [score("a", { totalPoints: 1 })], "a"),
        scored("m2", "2026-06-02T00:00:00Z", [score("a")], "b"), // a loses
      ],
    );
    expect(board[0].currentStreak).toBe(-1);
  });
});

describe("buildLeaderboard — join-date eligibility (no carry-in)", () => {
  it("ignores matches that kicked off before a member joined", () => {
    const eligibleFrom = new Map([["a", "2026-06-10T00:00:00Z"]]);
    const board = buildLeaderboard(
      [A],
      [
        scored("early", "2026-06-01T00:00:00Z", [score("a", { totalPoints: 10 })], "a"), // before join
        scored("after", "2026-06-12T00:00:00Z", [score("a", { totalPoints: 3 })], "a"), // after join
      ],
      eligibleFrom,
    );
    expect(board[0].points).toBe(3); // the early 10 does NOT carry in
    expect(board[0].played).toBe(1);
  });

  it("counts a match exactly at the join instant", () => {
    const eligibleFrom = new Map([["a", "2026-06-10T00:00:00Z"]]);
    const board = buildLeaderboard(
      [A],
      [scored("m", "2026-06-10T00:00:00Z", [score("a", { totalPoints: 4 })], "a")],
      eligibleFrom,
    );
    expect(board[0].points).toBe(4);
  });

  it("no eligibility map = everything counts", () => {
    const board = buildLeaderboard([A], [scored("m", "2026-06-01T00:00:00Z", [score("a", { totalPoints: 7 })], "a")]);
    expect(board[0].points).toBe(7);
  });
});

describe("buildLeaderboard — confidence accuracy", () => {
  it("reports the hit-rate of boosted picks", () => {
    const board = buildLeaderboard(
      [A],
      [
        scored("m1", "2026-06-01T00:00:00Z", [score("a", { multiplier: 2, subtotal: 5, totalPoints: 10 })], "a"),
        scored("m2", "2026-06-02T00:00:00Z", [score("a", { multiplier: 2, subtotal: 0, totalPoints: 0 })], "b"),
      ],
    );
    expect(board[0].avgConfidenceAccuracy).toBe(50); // 1 of 2 boosted picks returned points
  });
});

import { describe, it, expect } from "vitest";
import { liveStandings } from "./live";
import type { Match, MatchEvent, Prediction } from "./types";

const match: Match = {
  id: "m1", homeTeamId: "arg", awayTeamId: "jpn",
  kickoffAt: "2026-06-01T00:00:00Z", status: "live", stage: "group",
  homeScore: 1, awayScore: 0, venue: "",
};
// One goal so far: arg1 scored first.
const events: MatchEvent[] = [
  { id: "e1", matchId: "m1", minute: 20, type: "goal", teamId: "arg", playerId: "arg1", playerName: "Messi" },
];

const preds: Prediction[] = [
  // Carina: 1-0 arg, Messi first scorer → leading provisionally.
  { userId: "carina", matchId: "m1", predictedHomeScore: 1, predictedAwayScore: 0, predictedWinnerTeamId: "arg", firstGoalScorerId: "arg1" },
  // Johnny: 0-2 jpn → currently wrong on everything.
  { userId: "johnny", matchId: "m1", predictedHomeScore: 0, predictedAwayScore: 2, predictedWinnerTeamId: "jpn" },
];

describe("liveStandings", () => {
  it("ranks by provisional points as the match stands", () => {
    const s = liveStandings(match, events, preds);
    expect(s[0].userId).toBe("carina");
    expect(s[0].score.totalPoints).toBeGreaterThan(s[1].score.totalPoints);
  });

  it("surfaces the hits already banked", () => {
    const s = liveStandings(match, events, preds);
    const carina = s.find((x) => x.userId === "carina")!;
    expect(carina.hits).toContain("Exact score ✓");
    expect(carina.hits).toContain("First scorer ✓");
  });

  it("a trailing prediction has no hits yet", () => {
    const s = liveStandings(match, events, preds);
    const johnny = s.find((x) => x.userId === "johnny")!;
    expect(johnny.hits).toEqual([]);
  });
});

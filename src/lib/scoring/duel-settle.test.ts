import { describe, it, expect } from "vitest";
import { settleDuel } from "./duel-settle";
import type { PotGuess, PotActual } from "./pots-settle";

const actual: PotActual = { homeScore: 2, awayScore: 1, result: "home", firstScorerId: "p9" };

function g(over: Partial<PotGuess> = {}): PotGuess {
  return { userId: "x", homeScore: null, awayScore: null, result: null, firstScorerId: null, ...over };
}

describe("settleDuel — FULL (SCORE) mode", () => {
  it("closest scoreline takes the whole stake", () => {
    const r = settleDuel("SCORE", g({ homeScore: 2, awayScore: 1 }), g({ homeScore: 0, awayScore: 0 }), actual, 100);
    expect(r.challengerNet).toBe(100);
  });
  it("equal distance pushes (no money moves)", () => {
    const r = settleDuel("SCORE", g({ homeScore: 3, awayScore: 1 }), g({ homeScore: 2, awayScore: 0 }), actual, 100);
    expect(r.challengerNet).toBe(0);
  });
  it("no prediction loses to any prediction", () => {
    const r = settleDuel("SCORE", g(), g({ homeScore: 5, awayScore: 5 }), actual, 50);
    expect(r.challengerNet).toBe(-50);
  });
});

describe("settleDuel — SPLIT mode", () => {
  it("splits the stake into equal thirds across three markets", () => {
    const r = settleDuel("SPLIT", g(), g(), actual, 90);
    expect(r.legs).toHaveLength(3);
    expect(r.legs.every((l) => l.share === 30)).toBe(true);
  });

  it("sweeping all three legs wins the full stake", () => {
    const c = g({ homeScore: 2, awayScore: 1, result: "home", firstScorerId: "p9" }); // perfect
    const o = g({ homeScore: 0, awayScore: 3, result: "away", firstScorerId: "p7" }); // all wrong
    const r = settleDuel("SPLIT", c, o, actual, 90);
    expect(r.challengerNet).toBe(90);
    expect(r.legs.map((l) => l.winner)).toEqual(["challenger", "challenger", "challenger"]);
  });

  it("legs are independent — winners can split the markets", () => {
    // challenger nails score+result; opponent nails first scorer
    const c = g({ homeScore: 2, awayScore: 1, result: "home", firstScorerId: "p1" });
    const o = g({ homeScore: 0, awayScore: 2, result: "away", firstScorerId: "p9" });
    const r = settleDuel("SPLIT", c, o, actual, 90);
    // +30 score +30 result −30 first-scorer = +30
    expect(r.challengerNet).toBe(30);
    expect(r.legs.find((l) => l.market === "FIRST_SCORER")!.winner).toBe("opponent");
  });

  it("a leg both get right (or both wrong) pushes", () => {
    const both = g({ result: "home" });
    const r = settleDuel("SPLIT", both, g({ result: "home" }), actual, 90);
    expect(r.legs.find((l) => l.market === "RESULT")!.winner).toBe("push");
  });

  it("is zero-sum from the opponent's perspective", () => {
    const c = g({ homeScore: 2, awayScore: 1, result: "home", firstScorerId: "p9" });
    const o = g({ homeScore: 1, awayScore: 1, result: "draw", firstScorerId: "p7" });
    const r = settleDuel("SPLIT", c, o, actual, 90);
    // opponent's net is just the negation
    expect(r.challengerNet).toBe(-settleDuel("SPLIT", o, c, actual, 90).challengerNet);
  });
});

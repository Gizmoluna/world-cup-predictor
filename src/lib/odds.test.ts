import { describe, it, expect } from "vitest";
import { winProbability, asPercent } from "./odds";
import type { Standing } from "./types";

function st(over: Partial<Standing>): Standing {
  return {
    teamId: "t", groupName: "A", played: 3, won: 0, drawn: 0, lost: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, rank: 1, ...over,
  };
}

describe("winProbability", () => {
  it("always returns a normalised distribution", () => {
    const p = winProbability(st({ points: 9, goalDifference: 6 }), st({ points: 0, goalDifference: -6 }));
    const sum = p.home + p.draw + p.away;
    expect(sum).toBeGreaterThan(0.99);
    expect(sum).toBeLessThan(1.01);
  });

  it("favours the stronger side", () => {
    const strong = st({ played: 3, points: 9, goalDifference: 8 });
    const weak = st({ played: 3, points: 0, goalDifference: -8 });
    const p = winProbability(strong, weak);
    expect(p.home).toBeGreaterThan(p.away);
    expect(p.home).toBeGreaterThan(p.draw);
  });

  it("blends toward even when no games have been played", () => {
    const p = winProbability(st({ played: 0 }), st({ played: 0 }));
    expect(p.confidence).toBe(0);
    // home edge is zeroed out by zero form weight → essentially even
    expect(Math.abs(p.home - p.away)).toBeLessThan(0.02);
  });

  it("gives the home side an edge between evenly-matched teams", () => {
    const even = { played: 3, points: 4, goalDifference: 1 };
    const p = winProbability(st(even), st(even));
    expect(p.home).toBeGreaterThan(p.away);
    const neutral = winProbability(st(even), st(even), true);
    expect(Math.abs(neutral.home - neutral.away)).toBeLessThan(0.01);
  });
});

describe("asPercent", () => {
  it("sums to exactly 100", () => {
    const p = winProbability(st({ points: 7, goalDifference: 4 }), st({ points: 2, goalDifference: -2 }));
    const pct = asPercent(p);
    expect(pct.home + pct.draw + pct.away).toBe(100);
  });
});

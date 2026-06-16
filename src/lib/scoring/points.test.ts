import { describe, it, expect } from "vitest";
import { POINTS, changeCost, changePenaltyFor } from "./points";

// The escalating change-penalty is the core of the "changing your mind costs
// points" gamification, and the numbers here are exactly what the /how-it-works
// screen renders — so these tests pin both the mechanic and the displayed ladder.

describe("changeCost — escalating penalty ladder", () => {
  it("is free below the first change", () => {
    expect(changeCost(0)).toBe(0);
    expect(changeCost(-1)).toBe(0);
  });

  it("escalates: cheap first, +changeStep each time", () => {
    // With defaults changeFirst=1, changeStep=2 → 1, 3, 5, 7...
    expect(changeCost(1)).toBe(POINTS.changeFirst);
    expect(changeCost(2)).toBe(POINTS.changeFirst + POINTS.changeStep);
    expect(changeCost(3)).toBe(POINTS.changeFirst + 2 * POINTS.changeStep);
    expect(changeCost(4)).toBe(POINTS.changeFirst + 3 * POINTS.changeStep);
  });

  it("matches the ladder shown in the rules screen (1, 3, 5, 7)", () => {
    expect([1, 2, 3, 4].map(changeCost)).toEqual([1, 3, 5, 7]);
  });

  it("is strictly increasing", () => {
    for (let n = 1; n < 10; n++) expect(changeCost(n + 1)).toBeGreaterThan(changeCost(n));
  });
});

describe("changePenaltyFor — magnitude-scaled penalty", () => {
  it("full edits (magnitude 1) cost the full ladder amount", () => {
    expect(changePenaltyFor(1, 1)).toBe(changeCost(1));
    expect(changePenaltyFor(3, 1)).toBe(changeCost(3));
  });

  it("defaults magnitude to a full edit", () => {
    expect(changePenaltyFor(2)).toBe(changeCost(2));
  });

  it("small edits cost proportionally less, but always at least 1", () => {
    // change #3 = 5 pts; a half-sized edit (swap 2 of 4 teams) ≈ 2.5 → rounds to 3
    expect(changePenaltyFor(3, 0.5)).toBe(Math.round(changeCost(3) * 0.5));
    // a tiny edit never costs 0 if it's a real change
    expect(changePenaltyFor(1, 0.01)).toBe(1);
  });

  it("a non-edit (magnitude 0) or non-change (level 0) costs nothing", () => {
    expect(changePenaltyFor(1, 0)).toBe(0);
    expect(changePenaltyFor(0, 1)).toBe(0);
  });

  it("clamps magnitude above 1 to a full edit", () => {
    expect(changePenaltyFor(2, 5)).toBe(changeCost(2));
  });

  it("a bigger edit never costs less than a smaller edit at the same level", () => {
    const small = changePenaltyFor(4, 0.25);
    const big = changePenaltyFor(4, 1);
    expect(big).toBeGreaterThanOrEqual(small);
  });
});

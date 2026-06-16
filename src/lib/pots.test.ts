import { describe, it, expect } from "vitest";
import { settlePot, potPayouts, type PotGuess, type PotActual } from "./scoring/pots-settle";

const actual: PotActual = { homeScore: 2, awayScore: 1, result: "home", firstScorerId: "p9" };

function g(userId: string, over: Partial<PotGuess> = {}): PotGuess {
  return { userId, homeScore: null, awayScore: null, result: null, firstScorerId: null, ...over };
}

describe("settlePot — SCORE (closest scoreline)", () => {
  it("exact scoreline beats a close one", () => {
    const r = settlePot("SCORE", [
      g("a", { homeScore: 2, awayScore: 1, result: "home" }),
      g("b", { homeScore: 3, awayScore: 1, result: "home" }),
    ], actual);
    expect(r).toEqual({ winnerIds: ["a"], void: false });
  });

  it("equal closeness splits", () => {
    const r = settlePot("SCORE", [
      g("a", { homeScore: 3, awayScore: 1 }), // dist 1
      g("b", { homeScore: 2, awayScore: 0 }), // dist 1
    ], actual);
    expect(r.void).toBe(false);
    expect(r.winnerIds.sort()).toEqual(["a", "b"]);
  });

  it("voids when nobody predicted a scoreline", () => {
    expect(settlePot("SCORE", [g("a"), g("b")], actual)).toEqual({ winnerIds: [], void: true });
  });
});

describe("settlePot — RESULT", () => {
  it("everyone who got the result splits; wrong ones excluded", () => {
    const r = settlePot("RESULT", [
      g("a", { result: "home" }),
      g("b", { result: "home" }),
      g("c", { result: "draw" }),
    ], actual);
    expect(r.winnerIds.sort()).toEqual(["a", "b"]);
  });

  it("voids when nobody got the result", () => {
    expect(settlePot("RESULT", [g("a", { result: "away" })], actual)).toEqual({ winnerIds: [], void: true });
  });
});

describe("settlePot — FIRST_SCORER", () => {
  it("matches the actual first scorer", () => {
    const r = settlePot("FIRST_SCORER", [g("a", { firstScorerId: "p9" }), g("b", { firstScorerId: "p7" })], actual);
    expect(r).toEqual({ winnerIds: ["a"], void: false });
  });

  it("voids when the actual first scorer is unknown", () => {
    const noScorer = { ...actual, firstScorerId: null };
    expect(settlePot("FIRST_SCORER", [g("a", { firstScorerId: "p9" })], noScorer)).toEqual({
      winnerIds: [],
      void: true,
    });
  });
});

describe("potPayouts", () => {
  it("a single winner takes the whole pot, others lose their ante", () => {
    const pay = potPayouts(10, ["a", "b", "c"], { winnerIds: ["a"], void: false });
    expect(pay.get("a")).toBe(20); // 30 pot − 10 ante
    expect(pay.get("b")).toBe(-10);
    expect(pay.get("c")).toBe(-10);
  });

  it("splits the pot between tied winners", () => {
    const pay = potPayouts(10, ["a", "b", "c", "d"], { winnerIds: ["a", "b"], void: false });
    expect(pay.get("a")).toBe(10); // 40/2 = 20 − 10 ante
    expect(pay.get("b")).toBe(10);
    expect(pay.get("c")).toBe(-10);
  });

  it("refunds everyone (net 0) on a void pot", () => {
    const pay = potPayouts(25, ["a", "b"], { winnerIds: [], void: true });
    expect(pay.get("a")).toBe(0);
    expect(pay.get("b")).toBe(0);
  });

  it("is zero-sum (winnings equal losses)", () => {
    const pay = potPayouts(10, ["a", "b", "c"], { winnerIds: ["a"], void: false });
    const sum = [...pay.values()].reduce((s, v) => s + v, 0);
    expect(sum).toBe(0);
  });
});

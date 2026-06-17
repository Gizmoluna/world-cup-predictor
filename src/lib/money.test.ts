import { describe, it, expect } from "vitest";
import { spyFee, getBalances, STARTING_BALANCE, SPY_FEES } from "./money";
import { recordSpyReveal } from "./spy";

// Fixed reference point so the tier maths is deterministic.
const NOW = new Date("2026-06-20T12:00:00Z");
const hoursFromNow = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();

describe("spyFee — rises as kickoff nears", () => {
  it("is cheapest more than 24h out", () => {
    expect(spyFee(hoursFromNow(48), NOW)).toBe(SPY_FEES.far);
    expect(spyFee(hoursFromNow(24), NOW)).toBe(SPY_FEES.far); // 24h exactly → still far
  });
  it("is mid-priced inside 24h", () => {
    expect(spyFee(hoursFromNow(23), NOW)).toBe(SPY_FEES.mid);
    expect(spyFee(hoursFromNow(2), NOW)).toBe(SPY_FEES.mid); // 2h exactly → mid
  });
  it("is dearest inside the final 2h (incl. past kickoff)", () => {
    expect(spyFee(hoursFromNow(1.5), NOW)).toBe(SPY_FEES.near);
    expect(spyFee(hoursFromNow(0), NOW)).toBe(SPY_FEES.near);
  });
});

describe("getBalances — one balance from every game", () => {
  it("with no activity, everyone sits at the starting bankroll", async () => {
    const bals = await getBalances(new Map([["u_idle", 0]]));
    const b = bals.get("u_idle")!;
    expect(b.total).toBe(STARTING_BALANCE);
    expect(b).toMatchObject({ wagers: 0, duels: 0, pots: 0, spy: 0 });
  });

  it("folds wager P&L into the total", async () => {
    const bals = await getBalances(new Map([["u_wager", 150]]));
    expect(bals.get("u_wager")!.total).toBe(STARTING_BALANCE + 150);
  });

  it("subtracts spy fees and records them as a negative component", async () => {
    await recordSpyReveal({ buyerId: "u_spy", targetId: "v1", matchId: "m1", leagueId: "lg", fee: 20 });
    await recordSpyReveal({ buyerId: "u_spy", targetId: "v2", matchId: "m1", leagueId: "lg", fee: 40 });
    const b = (await getBalances(new Map([["u_spy", 0]]))).get("u_spy")!;
    expect(b.spy).toBe(-60);
    expect(b.total).toBe(STARTING_BALANCE - 60);
  });

  it("re-spying the same pick never double-charges (idempotent)", async () => {
    await recordSpyReveal({ buyerId: "u_dup", targetId: "v1", matchId: "m9", leagueId: "lg", fee: 20 });
    await recordSpyReveal({ buyerId: "u_dup", targetId: "v1", matchId: "m9", leagueId: "lg", fee: 20 });
    const b = (await getBalances(new Map([["u_dup", 0]]))).get("u_dup")!;
    expect(b.spy).toBe(-20);
  });
});

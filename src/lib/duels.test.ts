import { describe, it, expect, beforeAll } from "vitest";
import {
  createDuel,
  setDuelStatus,
  getMatchDuels,
  resolveDuel,
  getLeagueLedger,
  getDuelBalance,
} from "./duels";
import { getBalances, STARTING_BALANCE } from "./money";

// Seeded demo data: match "f1" is finished arg 3–1 jpn; carina predicted the
// exact 3–1, johnny predicted 2–0. A SCORE duel between them therefore settles
// for carina once the result is in — this proves winnings/debts auto-populate
// off the match result with no extra write step.
describe("duel ledger auto-populates after the result", () => {
  beforeAll(async () => {
    await createDuel("f1", "carina", "johnny", 50, "SCORE");
    const [duel] = await getMatchDuels("f1");
    await setDuelStatus(duel.id, "johnny", "accepted");
  });

  it("resolves the duel from the finished match (carina nails the exact score)", async () => {
    const [duel] = await getMatchDuels("f1");
    const o = await resolveDuel(duel);
    expect(o.settled).toBe(true);
    expect(o.winnerId).toBe("carina");
    expect(o.challengerNet).toBe(50);
  });

  it("populates the league winnings & debts ledger", async () => {
    const ledger = await getLeagueLedger(["carina", "johnny"]);
    const carina = ledger.members.find((m) => m.userId === "carina")!;
    const johnny = ledger.members.find((m) => m.userId === "johnny")!;
    expect(carina).toMatchObject({ net: 50, won: 50, lost: 0 });
    expect(johnny).toMatchObject({ net: -50, won: 0, lost: 50 });
    // One debt: johnny owes carina the stake.
    expect(ledger.debts).toContainEqual({ fromId: "johnny", toId: "carina", amount: 50 });
  });

  it("flows through to each player's bank balance", async () => {
    expect(await getDuelBalance("carina")).toBe(50);
    expect(await getDuelBalance("johnny")).toBe(-50);
    const bals = await getBalances(new Map([["carina", 0], ["johnny", 0]]));
    expect(bals.get("carina")!.duels).toBe(50);
    expect(bals.get("carina")!.total).toBe(STARTING_BALANCE + 50);
    expect(bals.get("johnny")!.total).toBe(STARTING_BALANCE - 50);
  });
});

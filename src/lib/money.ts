// ---------------------------------------------------------------------------
// THE BANK — one play-money balance, defined in one place.
//
// Every player starts with the same bankroll. From there, exactly four games
// move your balance, and nothing else does:
//   • Solo wagers  — staking on your own match prediction (±)
//   • Duels        — head-to-head stakes vs a rival (±)
//   • Group pots   — whole-league side pots on a match (±)
//   • Spying       — paying to reveal a rival's hidden upcoming pick (−)
//
//   balance = STARTING_BALANCE + wagers + duels + pots − spyFees
//
// This is the single source of truth. The leaderboard, a profile and the duels
// ledger all read balance the same way, so the number is always the same.
// ---------------------------------------------------------------------------

import "server-only";
import { getDuelBalance } from "@/lib/duels";
import { getPotNetByUsers } from "@/lib/pots";
import { getSpySpendByUsers } from "@/lib/spy";

/** What every player's bank starts at. */
export const STARTING_BALANCE = 1000;

/** Spy-fee tiers (paid into the league pot). */
export const SPY_FEES = { far: 10, mid: 20, near: 40 } as const;

/**
 * The fee to reveal a rival's hidden pick — it climbs as kickoff approaches, so
 * peeking early is cheap and peeking at the last minute is dear. Computed
 * server-side at purchase time from the real kickoff, never trusted from a client.
 */
export function spyFee(kickoffAt: string, now: Date = new Date()): number {
  const hrs = (new Date(kickoffAt).getTime() - now.getTime()) / 3_600_000;
  if (hrs < 2) return SPY_FEES.near;
  if (hrs < 24) return SPY_FEES.mid;
  return SPY_FEES.far;
}

export interface Balance {
  starting: number;
  wagers: number; // solo match-wager P&L (net)
  duels: number; // head-to-head duel P&L (net)
  pots: number; // group-pot P&L (net)
  spy: number; // spy fees paid this season (≤ 0)
  total: number;
}

/**
 * Assemble every player's balance from each game's already-net result. Pass in
 * the solo-wager P&L the read model has already computed (keyed by userId) so we
 * don't recompute it; we add the duel, pot and spy components on top.
 */
export async function getBalances(
  wagerByUser: Map<string, number>,
): Promise<Map<string, Balance>> {
  const ids = [...wagerByUser.keys()];
  const [potNet, spySpend, duelNets] = await Promise.all([
    getPotNetByUsers(ids),
    getSpySpendByUsers(ids),
    Promise.all(ids.map((id) => getDuelBalance(id))),
  ]);
  const duelByUser = new Map(ids.map((id, i) => [id, duelNets[i]]));

  const out = new Map<string, Balance>();
  for (const id of ids) {
    const wagers = wagerByUser.get(id) ?? 0;
    const duels = duelByUser.get(id) ?? 0;
    const pots = potNet.get(id) ?? 0;
    const spent = spySpend.get(id) ?? 0; // positive amount spent
    out.set(id, {
      starting: STARTING_BALANCE,
      wagers,
      duels,
      pots,
      spy: -spent,
      total: STARTING_BALANCE + wagers + duels + pots - spent,
    });
  }
  return out;
}

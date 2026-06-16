// Pure settlement core for group pots — no I/O, no server-only, fully testable.
import type { PotCriteria } from "@/lib/types";

export interface PotGuess {
  userId: string;
  homeScore: number | null;
  awayScore: number | null;
  result: "home" | "away" | "draw" | null;
  firstScorerId: string | null;
}
export interface PotActual {
  homeScore: number;
  awayScore: number;
  result: "home" | "away" | "draw";
  firstScorerId: string | null;
}
export interface PotSettlement {
  winnerIds: string[];
  void: boolean; // nobody qualified → refund everyone
}

/**
 * Given the criteria, every entrant's guess and the actual result, decide the
 * winner(s). SCORE = closest scoreline (ties split); RESULT = all who called the
 * outcome; FIRST_SCORER = all who named the actual first scorer. If nobody
 * qualifies the pot voids (refund).
 */
export function settlePot(
  criteria: PotCriteria,
  guesses: PotGuess[],
  actual: PotActual,
): PotSettlement {
  if (guesses.length === 0) return { winnerIds: [], void: true };

  if (criteria === "SCORE") {
    const scored = guesses.filter((g) => g.homeScore != null && g.awayScore != null);
    if (scored.length === 0) return { winnerIds: [], void: true };
    const dist = (g: PotGuess) =>
      Math.abs((g.homeScore as number) - actual.homeScore) +
      Math.abs((g.awayScore as number) - actual.awayScore);
    const best = Math.min(...scored.map(dist));
    return { winnerIds: scored.filter((g) => dist(g) === best).map((g) => g.userId), void: false };
  }

  if (criteria === "RESULT") {
    const winners = guesses.filter((g) => g.result === actual.result).map((g) => g.userId);
    return winners.length ? { winnerIds: winners, void: false } : { winnerIds: [], void: true };
  }

  // FIRST_SCORER
  if (!actual.firstScorerId) return { winnerIds: [], void: true };
  const winners = guesses
    .filter((g) => g.firstScorerId && g.firstScorerId === actual.firstScorerId)
    .map((g) => g.userId);
  return winners.length ? { winnerIds: winners, void: false } : { winnerIds: [], void: true };
}

/** Per-user net payout: winners split the pot, others lose the ante; void → refund (0). */
export function potPayouts(
  ante: number,
  entrantIds: string[],
  settlement: PotSettlement,
): Map<string, number> {
  const out = new Map<string, number>();
  if (settlement.void || settlement.winnerIds.length === 0) {
    for (const id of entrantIds) out.set(id, 0);
    return out;
  }
  const pot = ante * entrantIds.length;
  const share = Math.floor(pot / settlement.winnerIds.length);
  const winners = new Set(settlement.winnerIds);
  for (const id of entrantIds) out.set(id, winners.has(id) ? share - ante : -ante);
  return out;
}

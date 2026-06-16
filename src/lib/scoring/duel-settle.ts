// Pure settlement core for 1v1 duels — no I/O, fully testable.
//
// FULL mode ("SCORE"): the whole stake rides on the closest 90' scoreline.
// SPLIT mode: the stake is divided equally across three markets — closest
// score, match result, and first goalscorer — and each leg is settled on its
// own (one player right & the other wrong takes that leg; otherwise it pushes).
import type { PotGuess, PotActual } from "./pots-settle";

export type DuelMode = "SCORE" | "SPLIT";
export type LegMarket = "SCORE" | "RESULT" | "FIRST_SCORER";
export type LegWinner = "challenger" | "opponent" | "push";

export interface DuelLeg {
  market: LegMarket;
  share: number;
  winner: LegWinner;
}
export interface DuelSettlement {
  challengerNet: number; // +/− from the challenger's perspective
  legs: DuelLeg[];
}

function scoreDist(g: PotGuess, actual: PotActual): number | null {
  return g.homeScore != null && g.awayScore != null
    ? Math.abs(g.homeScore - actual.homeScore) + Math.abs(g.awayScore - actual.awayScore)
    : null;
}

function closestWinner(c: PotGuess, o: PotGuess, actual: PotActual): LegWinner {
  const cd = scoreDist(c, actual);
  const od = scoreDist(o, actual);
  if (cd == null && od == null) return "push";
  if (od == null || (cd != null && cd < od)) return "challenger";
  if (cd == null || od < cd) return "opponent";
  return "push"; // equal distance
}

// One leg of a head-to-head boolean market: exactly one correct takes it.
function boolLeg(cRight: boolean, oRight: boolean): LegWinner {
  if (cRight && !oRight) return "challenger";
  if (oRight && !cRight) return "opponent";
  return "push";
}

export function settleDuel(
  mode: DuelMode,
  challenger: PotGuess,
  opponent: PotGuess,
  actual: PotActual,
  stake: number,
): DuelSettlement {
  if (mode === "SCORE") {
    const winner = closestWinner(challenger, opponent, actual);
    const net = winner === "challenger" ? stake : winner === "opponent" ? -stake : 0;
    return { challengerNet: net, legs: [{ market: "SCORE", share: stake, winner }] };
  }

  // SPLIT — equal thirds across score / result / first scorer.
  const share = Math.floor(stake / 3);
  const legs: DuelLeg[] = [
    { market: "SCORE", share, winner: closestWinner(challenger, opponent, actual) },
    {
      market: "RESULT",
      share,
      winner: boolLeg(challenger.result === actual.result, opponent.result === actual.result),
    },
    {
      market: "FIRST_SCORER",
      share,
      winner: boolLeg(
        !!actual.firstScorerId && challenger.firstScorerId === actual.firstScorerId,
        !!actual.firstScorerId && opponent.firstScorerId === actual.firstScorerId,
      ),
    },
  ];
  const challengerNet = legs.reduce(
    (s, l) => s + (l.winner === "challenger" ? l.share : l.winner === "opponent" ? -l.share : 0),
    0,
  );
  return { challengerNet, legs };
}

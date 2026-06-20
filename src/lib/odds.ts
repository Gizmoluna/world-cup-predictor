// ---------------------------------------------------------------------------
// Win probabilities — a self-computed model so the app shows odds with no paid
// feed and no external dependency. Strength comes from each team's tournament
// form (points-per-game + goal difference); the gap (plus a small home edge) is
// turned into Home / Draw / Away percentages. Early on, with little form to go
// on, it blends toward even — and it's always labelled a model estimate, not a
// bookmaker price. A real odds feed can later replace `winProbability` behind
// the same shape. Pure & testable.
// ---------------------------------------------------------------------------

import type { Standing } from "@/lib/types";

export interface WinProb {
  home: number; // 0..1
  draw: number;
  away: number;
  /** 0..1 — how much real form fed the estimate (low early in a tournament). */
  confidence: number;
}

const HOME_EDGE = 0.15; // small bump to the home side's strength
const FORM_MATCHES = 6; // games of form before the model is "fully" trusted

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Points-per-game (0..3) plus a goal-difference-per-game nudge → a strength. */
function strength(s?: Standing): { rating: number; played: number } {
  if (!s || s.played === 0) return { rating: 1.0, played: 0 };
  const ppg = s.points / s.played;
  const gdpg = s.goalDifference / s.played;
  return { rating: ppg + 0.3 * gdpg, played: s.played };
}

/**
 * Home/Draw/Away probabilities for a fixture from the two teams' standings.
 * `neutral` (knockouts at neutral venues) drops the home edge.
 */
export function winProbability(
  home?: Standing,
  away?: Standing,
  neutral = false,
): WinProb {
  const h = strength(home);
  const a = strength(away);

  // Trust the form gap in proportion to how many games we've actually seen.
  const sample = Math.min(h.played + a.played, FORM_MATCHES);
  const formWeight = sample / FORM_MATCHES;

  const edge = neutral ? 0 : HOME_EDGE;
  const diff = (h.rating + edge - a.rating) * formWeight;
  const rho = Math.max(-1, Math.min(1, diff / 2)); // normalise into [-1, 1]

  // Bigger gaps → fewer draws. Draw share between 18% and 32%.
  const draw = 0.32 - 0.14 * Math.abs(rho);
  const decisive = 1 - draw;
  const homeShare = sigmoid(3 * rho); // fraction of decisive games the home side takes
  const round = (n: number) => Math.round(n * 1000) / 1000;

  return {
    home: round(decisive * homeShare),
    draw: round(draw),
    away: round(decisive * (1 - homeShare)),
    confidence: round(formWeight),
  };
}

/** Whole-number percentages that always sum to 100 (largest remainder). */
export function asPercent(p: WinProb): { home: number; draw: number; away: number } {
  const raw = [p.home, p.draw, p.away].map((x) => x * 100);
  const floor = raw.map(Math.floor);
  let rem = 100 - floor.reduce((s, n) => s + n, 0);
  // hand the leftover points to the largest fractional parts
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((x, y) => y.frac - x.frac);
  const out = [...floor];
  for (const { i } of order) {
    if (rem <= 0) break;
    out[i] += 1;
    rem -= 1;
  }
  return { home: out[0], draw: out[1], away: out[2] };
}

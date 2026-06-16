// ---------------------------------------------------------------------------
// Leaderboard core — pure, no I/O, no server-only. Turns scored matches into
// ranked rows, applying each member's join-date eligibility (matches before you
// joined a league don't count). This is the logic that decides who's winning,
// so it's unit-tested directly.
// ---------------------------------------------------------------------------

import type { AppUser, Match, PredictionScore } from "@/lib/types";

export interface ScoredMatch {
  match: Match;
  scores: PredictionScore[]; // one per user who predicted
  winnerUserId: string | null; // h2h winner of this match, null = tie/none
}

export interface LeaderboardRow {
  user: AppUser;
  points: number;
  played: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  exactScores: number;
  perfectPicks: number;
  badges: string[];
  currentStreak: number; // +n win streak, -n loss streak
  avgConfidenceAccuracy: number; // 0..100
  winnings: number; // cumulative fake-money profit/loss ($)
  groupPoints: number; // points from correct group-winner picks
  groupCorrect: number; // count of correct group-winner picks
  knockoutPoints: number; // points from correct knockout-winner picks
  futuresPenalty: number; // points lost to changing futures picks
  loyaltyBonus: number; // points gained from rivals who changed (loyalty payout)
}

function emptyRow(user: AppUser): LeaderboardRow {
  return {
    user, points: 0, played: 0, matchWins: 0, matchLosses: 0, matchDraws: 0,
    exactScores: 0, perfectPicks: 0, badges: [], currentStreak: 0, avgConfidenceAccuracy: 0,
    winnings: 0, groupPoints: 0, groupCorrect: 0, knockoutPoints: 0, futuresPenalty: 0,
    loyaltyBonus: 0,
  };
}

export function buildLeaderboard(
  users: AppUser[],
  scored: ScoredMatch[],
  eligibleFrom?: Map<string, string>,
): LeaderboardRow[] {
  // Chronological for streaks.
  const ordered = [...scored].sort(
    (a, b) => new Date(a.match.kickoffAt).getTime() - new Date(b.match.kickoffAt).getTime(),
  );

  const rows = new Map<string, LeaderboardRow>();
  for (const u of users) rows.set(u.id, emptyRow(u));

  const confSamples = new Map<string, { boosted: number; boostedHit: number }>();

  for (const sm of ordered) {
    for (const s of sm.scores) {
      const row = rows.get(s.userId);
      if (!row) continue;
      // Fresh start: ignore matches that kicked off before this member joined.
      const from = eligibleFrom?.get(s.userId);
      if (from && new Date(sm.match.kickoffAt) < new Date(from)) continue;
      row.points += s.totalPoints;
      row.winnings += s.wagerProfit;
      row.played += 1;
      if (s.exactScorePoints > 0) row.exactScores += 1;
      if (s.badges.includes("perfect_prediction") || s.badges.includes("psychic_mode")) row.perfectPicks += 1;
      for (const b of s.badges) if (!row.badges.includes(b)) row.badges.push(b);

      // h2h W/L/D + streak
      if (sm.winnerUserId === s.userId) {
        row.matchWins += 1;
        row.currentStreak = row.currentStreak >= 0 ? row.currentStreak + 1 : 1;
      } else if (sm.winnerUserId === null) {
        row.matchDraws += 1;
        row.currentStreak = 0;
      } else {
        row.matchLosses += 1;
        row.currentStreak = row.currentStreak <= 0 ? row.currentStreak - 1 : -1;
      }

      // confidence accuracy: did a boosted match return points?
      if (s.multiplier > 1) {
        const c = confSamples.get(s.userId) ?? { boosted: 0, boostedHit: 0 };
        c.boosted += 1;
        if (s.subtotal > 0) c.boostedHit += 1;
        confSamples.set(s.userId, c);
      }
    }
  }

  for (const [uid, c] of confSamples) {
    const row = rows.get(uid);
    if (row) row.avgConfidenceAccuracy = c.boosted ? Math.round((c.boostedHit / c.boosted) * 100) : 0;
  }

  return [...rows.values()].sort((a, b) => b.points - a.points);
}

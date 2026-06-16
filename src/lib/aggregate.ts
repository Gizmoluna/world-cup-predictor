// ---------------------------------------------------------------------------
// Read model: pulls matches/teams/players from the provider + predictions from
// the data layer, then computes scores, the leaderboard and the Carina-vs-Johnny
// battle live. Single source of truth for the dashboard / leaderboard / battle /
// stats pages.
// ---------------------------------------------------------------------------

import "server-only";
import type {
  AppUser,
  Match,
  Player,
  Prediction,
  PredictionScore,
  Team,
} from "@/lib/types";
import { unstable_cache } from "next/cache";
import { getProvider } from "@/lib/football-api/provider";
import { getAllPredictions, getUsers } from "@/lib/data";
import { chrome } from "@/lib/display";
import { getLeagueMembers, getLeagueMemberSince } from "@/lib/leagues";
import { getAllGroupPredictions } from "@/lib/group-predictions";
import { getAllKnockoutPredictions } from "@/lib/knockout-predictions";
import { getAllGroupOrders, scoreGroupOrder } from "@/lib/group-orders";
import { buildMatchResult } from "@/lib/scoring/buildMatchResult";
import { calculatePredictionScore } from "@/lib/scoring/calculatePredictionScore";
import { POINTS } from "@/lib/scoring/points";
import type { Standing } from "@/lib/types";

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

export interface ReadModel {
  teams: Team[];
  players: Player[];
  matches: Match[];
  users: AppUser[];
  predictions: Prediction[];
  scoredMatches: ScoredMatch[];
  scoresByMatch: Map<string, PredictionScore[]>;
  leaderboard: LeaderboardRow[];
  teamById: Map<string, Team>;
  playerById: Map<string, Player>;
  /** userId → join time (ISO); matches before this don't count for that user. */
  eligibleFrom: Map<string, string>;
  standings: Standing[];
  /** Group name → winning team id, for groups that are mathematically decided. */
  decidedGroupWinners: Map<string, string>;
  /** Group name → full finishing order (team ids), for decided groups. */
  decidedGroupOrder: Map<string, string[]>;
}

export async function getReadModel(opts?: {
  restrictUserIds?: string[];
  leagueId?: string;
}): Promise<ReadModel> {
  const provider = getProvider();

  // When scoped to a league, restrict to its members and start each member's
  // scoring from the time they joined (matches before that don't count).
  let restrictIds = opts?.restrictUserIds;
  let eligibleFrom = new Map<string, string>();
  let leagueMembers: AppUser[] | null = null;
  if (opts?.leagueId) {
    const [members, since] = await Promise.all([
      getLeagueMembers(opts.leagueId),
      getLeagueMemberSince(opts.leagueId),
    ]);
    leagueMembers = members;
    restrictIds = members.map((m) => m.id);
    eligibleFrom = since;
  }
  const [teams, players, matches, allUsers, allPredictions, standings, groupPreds, koPreds] = await Promise.all([
    provider.getTeams(),
    provider.getPlayers(),
    provider.getMatches(),
    // Use the league's members directly (no all-users scan) when scoped.
    leagueMembers ? Promise.resolve(leagueMembers) : getUsers(),
    getAllPredictions(restrictIds),
    provider.getStandings(),
    getAllGroupPredictions(),
    getAllKnockoutPredictions(),
  ]);
  const groupOrders = await getAllGroupOrders();

  // Scope to a league's members when requested.
  const restrict = restrictIds ? new Set(restrictIds) : null;
  const users = restrict ? allUsers.filter((u) => restrict.has(u.id)) : allUsers;
  const predictions = restrict
    ? allPredictions.filter((p) => restrict.has(p.userId))
    : allPredictions;

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const favByUser = new Map(users.map((u) => [u.id, u.favouriteTeamId ?? null]));

  // Score finished matches — but only the ones someone actually predicted, so
  // we never fan out a per-match events fetch for the whole tournament.
  const predictedMatchIds = new Set(predictions.map((p) => p.matchId));
  const finished = matches.filter(
    (m) => m.status === "full_time" && predictedMatchIds.has(m.id),
  );
  const eventsLists = await Promise.all(
    finished.map((m) => provider.getMatchEvents(m.id)),
  );

  const scoredMatches: ScoredMatch[] = [];
  const scoresByMatch = new Map<string, PredictionScore[]>();

  finished.forEach((m, i) => {
    const preds = predictions.filter((p) => p.matchId === m.id);
    if (!preds.length) return;
    const scores = preds.map((p) => {
      // Favourite-team context for the underdog bonus (use the predictor's fav).
      const result = buildMatchResult(m, eventsLists[i], favByUser.get(p.userId) ?? null);
      return calculatePredictionScore(result, p);
    });
    scoresByMatch.set(m.id, scores);

    // Match winner = the single highest scorer among predictors (null if tied).
    let winnerUserId: string | null = null;
    const maxPts = Math.max(...scores.map((s) => s.totalPoints));
    const topScorers = scores.filter((s) => s.totalPoints === maxPts);
    if (topScorers.length === 1) winnerUserId = topScorers[0].userId;
    scoredMatches.push({ match: m, scores, winnerUserId });
  });

  const leaderboard = buildLeaderboard(users, scoredMatches, eligibleFrom);

  // --- group-winner futures -------------------------------------------------
  // A group is decided once every team in it has played its 3 games.
  const byGroup = new Map<string, Standing[]>();
  for (const s of standings) {
    if (!byGroup.has(s.groupName)) byGroup.set(s.groupName, []);
    byGroup.get(s.groupName)!.push(s);
  }
  const decidedGroupWinners = new Map<string, string>();
  const decidedGroupOrder = new Map<string, string[]>();
  for (const [g, rows] of byGroup) {
    if (rows.length >= 3 && rows.every((r) => r.played >= 3)) {
      const ordered = [...rows].sort(
        (a, b) =>
          (a.rank || 99) - (b.rank || 99) ||
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor,
      );
      if (ordered[0]) decidedGroupWinners.set(g, ordered[0].teamId);
      decidedGroupOrder.set(g, ordered.map((r) => r.teamId));
    }
  }
  const ordersByUser = new Map<string, Map<string, string[]>>();
  for (const o of groupOrders) {
    if (!ordersByUser.has(o.userId)) ordersByUser.set(o.userId, new Map());
    ordersByUser.get(o.userId)!.set(o.groupName, o.teamIds);
  }
  // Decided knockout matches → winner.
  const koWinner = new Map<string, string>();
  for (const m of matches) {
    if (m.stage !== "group" && m.status === "full_time" && m.winnerTeamId) {
      koWinner.set(m.id, m.winnerTeamId);
    }
  }

  // Who actually engaged with futures (so loyalty only rewards real players).
  const madeFutures = new Set<string>();
  for (const p of groupPreds) madeFutures.add(p.userId);
  for (const p of koPreds) madeFutures.add(p.userId);
  for (const o of groupOrders) madeFutures.add(o.userId);

  for (const row of leaderboard) {
    const userOrders = ordersByUser.get(row.user.id) ?? new Map<string, string[]>();
    // Full group-standings predictions (position-based points).
    for (const [g, order] of userOrders) {
      const actual = decidedGroupOrder.get(g);
      if (actual) {
        const { points, firstCorrect } = scoreGroupOrder(order, actual);
        row.groupPoints += points;
        if (firstCorrect) row.groupCorrect += 1;
      }
    }
    // Group-order change penalties (scaled by edit size at save time).
    for (const o of groupOrders) {
      if (o.userId === row.user.id) row.futuresPenalty += o.penalty ?? 0;
    }
    const gPicks = groupPreds.filter((gp) => gp.userId === row.user.id);
    for (const pick of gPicks) {
      // Don't double-count: skip the winner pick if a full order exists for it.
      if (!userOrders.has(pick.groupName) && decidedGroupWinners.get(pick.groupName) === pick.teamId) {
        row.groupPoints += POINTS.groupWinner;
        row.groupCorrect += 1;
      }
      row.futuresPenalty += pick.penalty ?? 0;
    }
    const kPicks = koPreds.filter((kp) => kp.userId === row.user.id);
    for (const pick of kPicks) {
      if (koWinner.get(pick.matchId) === pick.teamId) {
        row.knockoutPoints += POINTS.knockoutWinner;
      }
      // Win-method bonus (90 / ET / PENS) once the match is finished.
      const km = matchById.get(pick.matchId);
      if (km && km.status === "full_time" && pick.method) {
        const actual = km.shootout ? "PENS" : km.extraTime ? "ET" : "90";
        if (pick.method === actual) row.knockoutPoints += POINTS.winMethod;
      }
      row.futuresPenalty += pick.penalty ?? 0;
    }
    row.points += row.groupPoints + row.knockoutPoints - row.futuresPenalty;
  }

  // --- loyalty redistribution -----------------------------------------------
  // Every point forfeited by someone who changed their mind is pooled and split
  // among the loyal: players who made futures picks and never changed any of
  // them. Conviction pays; flip-flopping funds your rivals.
  const pot = leaderboard.reduce((sum, r) => sum + r.futuresPenalty, 0);
  if (pot > 0) {
    const loyal = leaderboard.filter(
      (r) => madeFutures.has(r.user.id) && r.futuresPenalty === 0,
    );
    if (loyal.length > 0) {
      const share = Math.floor(pot / loyal.length);
      if (share > 0) {
        for (const r of loyal) {
          r.loyaltyBonus = share;
          r.points += share;
        }
      }
    }
  }
  leaderboard.sort((a, b) => b.points - a.points);

  return {
    teams,
    players,
    matches,
    users,
    predictions,
    scoredMatches,
    scoresByMatch,
    leaderboard,
    teamById,
    playerById,
    eligibleFrom,
    standings,
    decidedGroupWinners,
    decidedGroupOrder,
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
  for (const u of users) {
    rows.set(u.id, {
      user: u, points: 0, played: 0, matchWins: 0, matchLosses: 0, matchDraws: 0,
      exactScores: 0, perfectPicks: 0, badges: [], currentStreak: 0, avgConfidenceAccuracy: 0,
      winnings: 0, groupPoints: 0, groupCorrect: 0, knockoutPoints: 0, futuresPenalty: 0,
      loyaltyBonus: 0,
    });
  }

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

// ---------------------------------------------------------------------------
// Global leaderboard — everyone, across all leagues.
//
// This is the one view that must aggregate every player, so it can't be scoped
// to a league's members. Computing it on every request would melt at scale, so
// we (a) cache the heavy computation for a few minutes and (b) cap the returned
// rows. The current viewer's own rank is resolved separately so a player who
// sits outside the visible top-N still sees where they stand.
// ---------------------------------------------------------------------------

export interface GlobalLeaderboardRow {
  userId: string;
  name: string;
  flag: string;
  theme: string;
  points: number;
  played: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  exactScores: number;
  perfectPicks: number;
  currentStreak: number;
  avgConfidenceAccuracy: number;
  winnings: number;
}

const GLOBAL_LEADERBOARD_CAP = 100;

function serializeGlobalRow(r: LeaderboardRow): GlobalLeaderboardRow {
  return {
    userId: r.user.id,
    name: r.user.name,
    flag: chrome(r.user).flag,
    theme: r.user.theme,
    points: r.points,
    played: r.played,
    matchWins: r.matchWins,
    matchDraws: r.matchDraws,
    matchLosses: r.matchLosses,
    exactScores: r.exactScores,
    perfectPicks: r.perfectPicks,
    currentStreak: r.currentStreak,
    avgConfidenceAccuracy: r.avgConfidenceAccuracy,
    winnings: r.winnings,
  };
}

const _computeGlobalLeaderboard = unstable_cache(
  async (): Promise<{ rows: GlobalLeaderboardRow[]; totalPlayers: number }> => {
    const model = await getReadModel();
    const ranked = model.leaderboard; // already sorted desc by points
    return {
      rows: ranked.slice(0, GLOBAL_LEADERBOARD_CAP).map(serializeGlobalRow),
      totalPlayers: ranked.length,
    };
  },
  ["global-leaderboard"],
  { revalidate: 300 },
);

/**
 * Cached, capped global leaderboard plus the viewer's own standing.
 * `viewerId` is resolved against the full ranking (not just the visible cap)
 * so the player always sees their true rank.
 */
export async function getGlobalLeaderboard(viewerId?: string): Promise<{
  rows: GlobalLeaderboardRow[];
  totalPlayers: number;
  viewerRank: number | null;
  viewerRow: GlobalLeaderboardRow | null;
}> {
  const { rows, totalPlayers } = await _computeGlobalLeaderboard();

  let viewerRank: number | null = null;
  let viewerRow: GlobalLeaderboardRow | null = null;
  if (viewerId) {
    const idx = rows.findIndex((r) => r.userId === viewerId);
    if (idx >= 0) {
      viewerRank = idx + 1;
      viewerRow = rows[idx];
    } else {
      // Outside the cached top-N — find true rank from the full model.
      const model = await getReadModel();
      const fullIdx = model.leaderboard.findIndex((r) => r.user.id === viewerId);
      if (fullIdx >= 0) {
        viewerRank = fullIdx + 1;
        viewerRow = serializeGlobalRow(model.leaderboard[fullIdx]);
      }
    }
  }

  return { rows, totalPlayers, viewerRank, viewerRow };
}

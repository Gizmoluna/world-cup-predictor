// ---------------------------------------------------------------------------
// Tournament insights — pure aggregations over matches + events. Powers the
// one-stop hub: Golden Boot race, top performers, tournament totals, team form.
// Pure & testable; the page feeds it already-fetched data. Works on the demo
// seed (hand-authored events) and on live ESPN data alike.
// ---------------------------------------------------------------------------

import type { Match, MatchEvent, Player, Team } from "@/lib/types";

const GOAL_TYPES = new Set(["goal", "penalty_goal"]); // shootout/own-goal excluded from Golden Boot

export interface ScorerRow {
  playerId: string;
  name: string;
  teamId: string | null;
  teamName: string | null;
  teamFlagUrl: string | null;
  goals: number;
  penalties: number;
}

/** Golden Boot race: goals per player across the given events. */
export function topScorers(
  events: MatchEvent[],
  playerById: Map<string, Player>,
  teamById: Map<string, Team>,
  limit = 15,
): ScorerRow[] {
  const by = new Map<string, ScorerRow>();
  for (const e of events) {
    if (!GOAL_TYPES.has(e.type) || !e.playerId) continue;
    const p = playerById.get(e.playerId);
    const team = e.teamId ? teamById.get(e.teamId) : undefined;
    const row =
      by.get(e.playerId) ??
      {
        playerId: e.playerId,
        name: p?.name ?? "Unknown",
        teamId: e.teamId ?? null,
        teamName: team?.shortName ?? team?.name ?? null,
        teamFlagUrl: team?.flagUrl ?? null,
        goals: 0,
        penalties: 0,
      };
    row.goals += 1;
    if (e.type === "penalty_goal") row.penalties += 1;
    by.set(e.playerId, row);
  }
  return [...by.values()].sort((a, b) => b.goals - a.goals).slice(0, limit);
}

export interface PerformerRow {
  playerId: string;
  name: string;
  teamName: string | null;
  awards: number;
}

/** Top performers — how often a player was named Player of the Match. */
export function topPerformers(
  events: MatchEvent[],
  playerById: Map<string, Player>,
  teamById: Map<string, Team>,
  limit = 10,
): PerformerRow[] {
  const by = new Map<string, PerformerRow>();
  for (const e of events) {
    if (e.description !== "player_of_match" || !e.playerId) continue;
    const p = playerById.get(e.playerId);
    const team = e.teamId ? teamById.get(e.teamId) : undefined;
    const row = by.get(e.playerId) ?? {
      playerId: e.playerId,
      name: p?.name ?? "Unknown",
      teamName: team?.shortName ?? team?.name ?? null,
      awards: 0,
    };
    row.awards += 1;
    by.set(e.playerId, row);
  }
  return [...by.values()].sort((a, b) => b.awards - a.awards).slice(0, limit);
}

export interface TournamentTotals {
  matchesPlayed: number;
  goals: number;
  goalsPerMatch: number;
  yellowCards: number;
  redCards: number;
  penalties: number;
  cleanSheets: number;
  biggestWin: { matchId: string; margin: number } | null;
}

/** Headline tournament numbers from finished matches + their events. */
export function tournamentTotals(matches: Match[], events: MatchEvent[]): TournamentTotals {
  const finished = matches.filter((m) => m.status === "full_time");
  let goals = 0, cleanSheets = 0;
  let biggest: TournamentTotals["biggestWin"] = null;
  for (const m of finished) {
    const h = m.homeScore ?? 0, a = m.awayScore ?? 0;
    goals += h + a;
    if (h === 0 || a === 0) cleanSheets += 1; // at least one side kept a clean sheet
    const margin = Math.abs(h - a);
    if (!biggest || margin > biggest.margin) biggest = { matchId: m.id, margin };
  }
  const yellowCards = events.filter((e) => e.type === "yellow_card").length;
  const redCards = events.filter((e) => e.type === "red_card").length;
  const penalties = events.filter((e) => e.type === "penalty_goal" || e.type === "penalty_missed").length;
  return {
    matchesPlayed: finished.length,
    goals,
    goalsPerMatch: finished.length ? Math.round((goals / finished.length) * 100) / 100 : 0,
    yellowCards,
    redCards,
    penalties,
    cleanSheets,
    biggestWin: biggest && biggest.margin > 0 ? biggest : null,
  };
}

export interface TeamForm {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  /** Most recent results first: "W" | "D" | "L". */
  form: ("W" | "D" | "L")[];
}

/** A single team's record across finished matches. */
export function teamForm(teamId: string, matches: Match[]): TeamForm {
  const played = matches
    .filter((m) => m.status === "full_time" && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => +new Date(b.kickoffAt) - +new Date(a.kickoffAt));
  const f: TeamForm = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, form: [] };
  for (const m of played) {
    const home = m.homeTeamId === teamId;
    const gf = (home ? m.homeScore : m.awayScore) ?? 0;
    const ga = (home ? m.awayScore : m.homeScore) ?? 0;
    f.played += 1;
    f.goalsFor += gf;
    f.goalsAgainst += ga;
    if (gf > ga) { f.wins += 1; f.form.push("W"); }
    else if (gf < ga) { f.losses += 1; f.form.push("L"); }
    else { f.draws += 1; f.form.push("D"); }
  }
  return f;
}

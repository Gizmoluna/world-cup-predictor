// ---------------------------------------------------------------------------
// API-Football (api-sports.io v3) provider.
//
// Activated when FOOTBALL_PROVIDER=api-football AND API_FOOTBALL_KEY is set.
// Maps the vendor schema onto the app's domain types. Server-only.
//
// Env:
//   API_FOOTBALL_KEY      — your api-sports.io key
//   API_FOOTBALL_LEAGUE   — league id (World Cup = 1)
//   API_FOOTBALL_SEASON   — season year (e.g. 2026)
// ---------------------------------------------------------------------------

import type {
  Match,
  MatchEvent,
  MatchStage,
  MatchStatus,
  NewsItem,
  Player,
  Standing,
  Team,
  TournamentLeaders,
  WorldCupFact,
} from "@/lib/types";
import type { FootballProvider } from "./provider";
import { FACTS_BANK } from "./facts-bank";

const BASE = "https://v3.football.api-sports.io";

function mapStatus(short: string): MatchStatus {
  if (["NS", "TBD"].includes(short)) return "upcoming";
  if (["1H", "2H", "HT", "ET", "P", "LIVE", "BT"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "full_time";
  if (["PST", "CANC", "ABD", "SUSP"].includes(short)) return "postponed";
  return "upcoming";
}

function mapStage(round: string): MatchStage {
  const r = round.toLowerCase();
  if (r.includes("final") && !r.includes("semi") && !r.includes("quarter")) return "final";
  if (r.includes("semi")) return "semi_final";
  if (r.includes("quarter")) return "quarter_final";
  if (r.includes("3rd") || r.includes("third")) return "third_place";
  if (r.includes("16")) return "round_of_16";
  if (r.includes("32")) return "round_of_32";
  return "group";
}

export class ApiFootballProvider implements FootballProvider {
  readonly name = "api-football";
  private league = process.env.API_FOOTBALL_LEAGUE ?? "1";
  private season = process.env.API_FOOTBALL_SEASON ?? "2026";

  private async call<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY ?? "" },
      // ISR-friendly: cache for 60s, callers can revalidate via cron
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`API-Football ${path} -> ${res.status}`);
    const json = (await res.json()) as { response: T };
    return json.response;
  }

  async getTeams(): Promise<Team[]> {
    const rows = await this.call<Array<{ team: { id: number; name: string; code?: string; logo: string } }>>(
      `/teams?league=${this.league}&season=${this.season}`,
    );
    return rows.map((r) => ({
      id: String(r.team.id),
      apiTeamId: r.team.id,
      name: r.team.name,
      shortName: r.team.code ?? r.team.name.slice(0, 3).toUpperCase(),
      flagUrl: r.team.logo,
    }));
  }

  async getPlayers(teamId?: string): Promise<Player[]> {
    if (!teamId) return [];
    const rows = await this.call<Array<{ player: { id: number; name: string; photo: string; position?: string } }>>(
      `/players?team=${teamId}&season=${this.season}`,
    );
    return rows.map((r) => ({
      id: String(r.player.id),
      apiPlayerId: r.player.id,
      teamId,
      name: r.player.name,
      position: r.player.position ?? null,
      imageUrl: r.player.photo ?? null,
    }));
  }

  async getMatches(): Promise<Match[]> {
    const rows = await this.call<Array<RawFixture>>(
      `/fixtures?league=${this.league}&season=${this.season}`,
    );
    return rows.map(mapFixture);
  }

  async getMatch(id: string): Promise<Match | null> {
    const rows = await this.call<Array<RawFixture>>(`/fixtures?id=${id}`);
    return rows[0] ? mapFixture(rows[0]) : null;
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const rows = await this.call<Array<RawEvent>>(`/fixtures/events?fixture=${matchId}`);
    return rows.map((e, i) => ({
      id: `${matchId}_${i}`,
      matchId,
      minute: e.time?.elapsed ?? null,
      type: mapEventType(e),
      teamId: e.team ? String(e.team.id) : null,
      playerId: e.player?.id ? String(e.player.id) : null,
      assistPlayerId: e.assist?.id ? String(e.assist.id) : null,
      description: e.detail ?? null,
    }));
  }

  async getStandings(): Promise<Standing[]> {
    const rows = await this.call<Array<{ league: { standings: RawStanding[][] } }>>(
      `/standings?league=${this.league}&season=${this.season}`,
    );
    const out: Standing[] = [];
    for (const block of rows) {
      for (const group of block.league.standings) {
        for (const s of group) {
          out.push({
            teamId: String(s.team.id),
            groupName: s.group ?? "",
            played: s.all.played,
            won: s.all.win,
            drawn: s.all.draw,
            lost: s.all.lose,
            goalsFor: s.all.goals.for,
            goalsAgainst: s.all.goals.against,
            goalDifference: s.goalsDiff,
            points: s.points,
            rank: s.rank,
          });
        }
      }
    }
    return out;
  }

  async getNews(): Promise<NewsItem[]> {
    // API-Football has no news endpoint; news comes from a separate provider.
    return [];
  }

  async getFacts(): Promise<WorldCupFact[]> {
    // No vendor facts endpoint — serve the curated bank; live facts are derived.
    return FACTS_BANK;
  }

  // Leaders not wired for this provider yet — populate via the espn provider.
  async getLeaders(): Promise<TournamentLeaders> {
    return { scorers: [], assists: [] };
  }
}

// --- raw vendor shapes (only the fields we use) -----------------------------
interface RawFixture {
  fixture: { id: number; date: string; venue?: { name?: string }; status: { short: string } };
  league: { round: string };
  teams: { home: { id: number }; away: { id: number } };
  goals: { home: number | null; away: number | null };
  score: { halftime: { home: number | null; away: number | null } };
}
interface RawEvent {
  time?: { elapsed?: number };
  team?: { id: number };
  player?: { id?: number };
  assist?: { id?: number };
  type: string;
  detail?: string;
}
interface RawStanding {
  rank: number;
  team: { id: number };
  points: number;
  goalsDiff: number;
  group?: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

function mapFixture(r: RawFixture): Match {
  const status = mapStatus(r.fixture.status.short);
  const homeScore = r.goals.home;
  const awayScore = r.goals.away;
  let winnerTeamId: string | null = null;
  if (status === "full_time" && homeScore != null && awayScore != null) {
    if (homeScore > awayScore) winnerTeamId = String(r.teams.home.id);
    else if (awayScore > homeScore) winnerTeamId = String(r.teams.away.id);
  }
  return {
    id: String(r.fixture.id),
    apiFixtureId: r.fixture.id,
    homeTeamId: String(r.teams.home.id),
    awayTeamId: String(r.teams.away.id),
    kickoffAt: r.fixture.date,
    venue: r.fixture.venue?.name ?? null,
    stage: mapStage(r.league.round),
    groupName: r.league.round.toLowerCase().includes("group")
      ? r.league.round.replace(/group\s*-?\s*/i, "Group ")
      : null,
    status,
    homeScore,
    awayScore,
    htHomeScore: r.score.halftime.home,
    htAwayScore: r.score.halftime.away,
    winnerTeamId,
    shootout: r.fixture.status.short === "PEN",
    extraTime: ["AET", "PEN"].includes(r.fixture.status.short),
    lastSyncedAt: new Date().toISOString(),
  };
}

function mapEventType(e: RawEvent): MatchEvent["type"] {
  if (e.type === "Goal") {
    if (e.detail === "Own Goal") return "own_goal";
    if (e.detail === "Penalty") return "penalty_goal";
    if (e.detail === "Missed Penalty") return "penalty_missed";
    return "goal";
  }
  if (e.type === "Card") return e.detail === "Red Card" ? "red_card" : "yellow_card";
  if (e.type === "subst") return "substitution";
  if (e.type === "Var") return "var";
  return "goal";
}

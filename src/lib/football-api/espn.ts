// ---------------------------------------------------------------------------
// ESPN provider — free, no API key, no signup. Uses ESPN's public soccer
// endpoints for the live FIFA World Cup (real fixtures, scores, results, goal
// scorers, cards and rosters). Unofficial but widely used; we fail soft so a
// transient hiccup never crashes a page.
//
// Activate with FOOTBALL_PROVIDER=espn.
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
  WorldCupFact,
} from "@/lib/types";
import type { FootballProvider } from "./provider";
import { FACTS_BANK } from "./facts-bank";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
// Tournament window — one scoreboard call returns every fixture.
const DATE_RANGE = "20260601-20260720";

function mapStatus(state: string): MatchStatus {
  if (state === "in") return "live";
  if (state === "post") return "full_time";
  return "upcoming";
}

function mapStage(slug: string | undefined): MatchStage {
  const s = (slug ?? "").toLowerCase();
  if (s.includes("final") && !s.includes("semi") && !s.includes("quarter")) return "final";
  if (s.includes("third") || s.includes("3rd")) return "third_place";
  if (s.includes("semi")) return "semi_final";
  if (s.includes("quarter")) return "quarter_final";
  if (s.includes("16")) return "round_of_16";
  if (s.includes("32")) return "round_of_32";
  return "group";
}

async function getJson<T>(url: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export class EspnProvider implements FootballProvider {
  readonly name = "espn";

  async getTeams(): Promise<Team[]> {
    const data = await getJson<any>(`${BASE}/teams`, 3600);
    const rows = data?.sports?.[0]?.leagues?.[0]?.teams ?? [];
    return rows.map((r: any) => ({
      id: String(r.team.id),
      apiTeamId: r.team.id,
      name: r.team.displayName,
      shortName: r.team.abbreviation ?? r.team.shortDisplayName ?? r.team.displayName,
      flagUrl: r.team.logo ?? "",
    }));
  }

  async getPlayers(teamId?: string): Promise<Player[]> {
    // No "all players" endpoint — fetching 48 rosters per request is too heavy,
    // so the global call returns []. Per-team rosters drive the prediction form.
    if (!teamId) return [];
    const data = await getJson<any>(`${BASE}/teams/${teamId}/roster`, 3600);
    const athletes = data?.athletes ?? [];
    const flat: any[] = athletes.flatMap((a: any) => (a.items ? a.items : [a]));
    return flat
      .filter((p) => p?.id)
      .map((p: any) => ({
        id: String(p.id),
        apiPlayerId: p.id,
        teamId,
        name: p.displayName ?? p.fullName ?? "Unknown",
        position: p.position?.abbreviation ?? null,
        imageUrl: p.headshot?.href ?? null,
      }));
  }

  async getMatches(): Promise<Match[]> {
    const data = await getJson<any>(`${BASE}/scoreboard?dates=${DATE_RANGE}&limit=400`);
    const events = data?.events ?? [];
    return events.map(mapEvent).filter(Boolean) as Match[];
  }

  async getMatch(id: string): Promise<Match | null> {
    return (await this.getMatches()).find((m) => m.id === id) ?? null;
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const data = await getJson<any>(`${BASE}/summary?event=${matchId}`);
    const key = data?.keyEvents ?? [];
    const out: MatchEvent[] = [];
    key.forEach((e: any, i: number) => {
      const type = mapEventType(e?.type?.text ?? "");
      if (!type) return;
      const minute = parseMinute(e?.clock?.displayValue);
      const participants = e?.participants ?? [];
      const scorer = participants[0]?.athlete;
      const assist = participants[1]?.athlete;
      out.push({
        id: `${matchId}_${i}`,
        matchId,
        minute,
        type,
        teamId: e?.team?.id ? String(e.team.id) : null,
        playerId: scorer?.id ? String(scorer.id) : null,
        assistPlayerId: assist?.id ? String(assist.id) : null,
        description: e?.type?.text ?? null,
      });
    });
    return out;
  }

  async getStandings(): Promise<Standing[]> {
    // ESPN's site standings endpoint is unreliable for the WC; the app derives
    // group leaders from results instead. Return empty.
    return [];
  }

  async getNews(): Promise<NewsItem[]> {
    const data = await getJson<any>(`${BASE}/news`, 600);
    const articles = data?.articles ?? [];
    return articles.slice(0, 20).map((a: any, i: number) => ({
      id: String(a.id ?? `espn_news_${i}`),
      title: a.headline ?? "World Cup update",
      summary: a.description ?? "",
      url: a.links?.web?.href ?? null,
      imageUrl: a.images?.[0]?.url ?? null,
      source: "ESPN",
      publishedAt: a.published ?? new Date().toISOString(),
      category: "report" as const,
    }));
  }

  async getFacts(): Promise<WorldCupFact[]> {
    return FACTS_BANK;
  }
}

function mapEvent(e: any): Match | null {
  const comp = e?.competitions?.[0];
  if (!comp) return null;
  const competitors = comp.competitors ?? [];
  const home = competitors.find((c: any) => c.homeAway === "home") ?? competitors[0];
  const away = competitors.find((c: any) => c.homeAway === "away") ?? competitors[1];
  if (!home || !away) return null;

  const state = comp.status?.type?.state ?? "pre";
  const status = mapStatus(state);
  const finished = status === "full_time" || status === "live";
  const homeScore = finished ? toInt(home.score) : null;
  const awayScore = finished ? toInt(away.score) : null;

  let winnerTeamId: string | null = null;
  if (status === "full_time") {
    if (home.winner) winnerTeamId = String(home.team.id);
    else if (away.winner) winnerTeamId = String(away.team.id);
  }

  return {
    id: String(e.id),
    apiFixtureId: e.id,
    homeTeamId: String(home.team.id),
    awayTeamId: String(away.team.id),
    kickoffAt: e.date,
    venue: comp.venue?.fullName ?? null,
    stage: mapStage(e.season?.slug),
    groupName: null,
    status,
    homeScore,
    awayScore,
    winnerTeamId,
    lastSyncedAt: new Date().toISOString(),
  };
}

function mapEventType(text: string): MatchEvent["type"] | null {
  const t = text.toLowerCase();
  if (t.includes("own goal")) return "own_goal";
  if (t.includes("penalty") && (t.includes("scored") || t.includes("goal"))) return "penalty_goal";
  if (t.includes("penalty") && t.includes("miss")) return "penalty_missed";
  if (t.includes("goal")) return "goal";
  if (t.includes("yellow")) return "yellow_card";
  if (t.includes("red")) return "red_card";
  if (t.includes("var") || t.includes("video review")) return "var";
  if (t.includes("substitution")) return "substitution";
  return null;
}

function parseMinute(v: string | undefined): number | null {
  if (!v) return null;
  const m = /(\d+)/.exec(v);
  return m ? parseInt(m[1], 10) : null;
}

function toInt(v: unknown): number {
  const n = parseInt(String(v ?? "0"), 10);
  return Number.isNaN(n) ? 0 : n;
}

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
  TournamentLeaders,
  LeaderEntry,
  WorldCupFact,
} from "@/lib/types";
import type { FootballProvider } from "./provider";
import { FACTS_BANK } from "./facts-bank";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const CORE = "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1";
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
      // ESPN exposes crests in a `logos` array (not `logo`). The originals are
      // 500px (~14KB each); serve a tiny resized version for fast lists.
      flagUrl: espnSmall(r.team.logo ?? r.team.logos?.[0]?.href ?? ""),
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
    // The 12 World Cup groups live in ESPN's core API. One cached call per
    // group returns the live table (team id is in the team $ref URL, so no
    // extra per-team fetch). Cached 30 min.
    const groups = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        getJson<any>(`${CORE}/groups/${i + 1}/standings/0?lang=en`, 1800).then((d) => ({
          n: i + 1,
          d,
        })),
      ),
    );
    const out: Standing[] = [];
    for (const { n, d } of groups) {
      if (!d) continue;
      const letter = String.fromCharCode(64 + n); // 1 -> A
      const entries = d.standings ?? [];
      for (const e of entries) {
        const teamId = String((e.team?.$ref?.match(/teams\/(\d+)/) ?? [])[1] ?? "");
        if (!teamId) continue;
        const stats: any[] = e.records?.[0]?.stats ?? [];
        const stat = (name: string) => {
          const s = stats.find((x) => x.name === name);
          return s ? Number(s.value) : 0;
        };
        out.push({
          teamId,
          groupName: `Group ${letter}`,
          played: stat("gamesPlayed"),
          won: stat("wins"),
          drawn: stat("ties"),
          lost: stat("losses"),
          goalsFor: stat("pointsFor"),
          goalsAgainst: stat("pointsAgainst"),
          goalDifference: stat("pointDifferential"),
          points: stat("points"),
          rank: stat("rank"),
        });
      }
    }
    return out;
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

  // Top scorers + assists from ESPN's leaders feed. The shape varies and is
  // empty until matches are played, so parse defensively and return [] on any
  // mismatch rather than throwing.
  async getLeaders(): Promise<TournamentLeaders> {
    const data = await getJson<any>(`${BASE}/leaders`, 900);
    const categories: any[] = data?.leaders?.categories ?? data?.categories ?? [];
    if (!Array.isArray(categories) || categories.length === 0) {
      return { scorers: [], assists: [] };
    }

    const pickCategory = (match: (name: string) => boolean) =>
      categories.find((c) => {
        const n = `${c?.name ?? ""} ${c?.displayName ?? ""} ${c?.abbreviation ?? ""}`.toLowerCase();
        return match(n);
      });

    const toEntries = (cat: any): LeaderEntry[] => {
      const rows: any[] = cat?.leaders ?? [];
      return rows
        .map((r) => {
          const ath = r?.athlete ?? {};
          const team = r?.team ?? ath?.team ?? {};
          const id = ath?.id ?? r?.id;
          if (id == null) return null;
          return {
            playerId: String(id),
            name: ath?.displayName ?? ath?.fullName ?? "Unknown",
            teamName: team?.displayName ?? team?.abbreviation ?? null,
            teamFlagUrl: espnSmall(team?.logo ?? team?.logos?.[0]?.href ?? ""),
            imageUrl: ath?.headshot?.href ?? null,
            value: Number(r?.value ?? r?.displayValue ?? 0) || 0,
          } as LeaderEntry;
        })
        .filter((e): e is LeaderEntry => Boolean(e))
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);
    };

    // Assists first (so "goalAssists" doesn't get grabbed by the scorer match).
    const assistCat = pickCategory((n) => n.includes("assist"));
    const scorerCat = pickCategory((n) => n.includes("goal") && !n.includes("assist"));

    return {
      scorers: scorerCat ? toEntries(scorerCat) : [],
      assists: assistCat ? toEntries(assistCat) : [],
    };
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
  const sName = String(comp.status?.type?.name ?? "").toUpperCase();
  const shootout = sName.includes("PEN");
  const extraTime = shootout || sName.includes("EXTRA") || sName.includes("AET");
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
    extraTime,
    shootout,
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

// Route ESPN crests through their resizer (~700 bytes vs ~14KB).
function espnSmall(url: string): string {
  const m = url.match(/a\.espncdn\.com(\/i\/.+)$/);
  return m ? `https://a.espncdn.com/combiner/i?img=${m[1]}&w=80&h=80` : url;
}

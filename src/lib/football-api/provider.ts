// ---------------------------------------------------------------------------
// Football data provider abstraction.
//
// The rest of the app NEVER talks to a vendor API directly — it talks to this
// interface. Swap providers via FOOTBALL_PROVIDER env without touching callers.
// All implementations return the app's own domain types (src/lib/types.ts).
//
// IMPORTANT: only ever call these from server code (route handlers / server
// components / server actions). API keys must never reach the client.
// ---------------------------------------------------------------------------

import type {
  Match,
  MatchEvent,
  NewsItem,
  Player,
  Standing,
  Team,
  WorldCupFact,
} from "@/lib/types";

export interface FootballProvider {
  readonly name: string;
  getTeams(): Promise<Team[]>;
  getPlayers(teamId?: string): Promise<Player[]>;
  getMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  getMatchEvents(matchId: string): Promise<MatchEvent[]>;
  getStandings(): Promise<Standing[]>;
  getNews(): Promise<NewsItem[]>;
  /** Evergreen / externally-sourced World Cup facts (swappable like the rest). */
  getFacts(): Promise<WorldCupFact[]>;
}

export type ProviderName =
  | "manual"
  | "espn"
  | "api-football"
  | "sportmonks"
  | "statorium"
  | "worldcupapi";

import { ManualProvider } from "./manual";
import { ApiFootballProvider } from "./api-football";
import { EspnProvider } from "./espn";

let cached: FootballProvider | null = null;

export function getProvider(): FootballProvider {
  if (cached) return cached;
  const name = (process.env.FOOTBALL_PROVIDER ?? "manual") as ProviderName;
  switch (name) {
    case "espn":
      // Free, no key — real live World Cup data.
      cached = new EspnProvider();
      break;
    case "api-football":
      // Falls back to manual seed data if no key is configured.
      cached = process.env.API_FOOTBALL_KEY
        ? new ApiFootballProvider()
        : new ManualProvider();
      break;
    // sportmonks / statorium / worldcupapi can be added here following the
    // same interface. Until then they resolve to the manual provider.
    case "sportmonks":
    case "statorium":
    case "worldcupapi":
    case "manual":
    default:
      cached = new ManualProvider();
  }
  return cached;
}

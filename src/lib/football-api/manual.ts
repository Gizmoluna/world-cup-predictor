// Manual / fallback provider — serves the seed dataset. Always available, no
// keys required. Admin manual overrides also flow through this in demo mode.

import type {
  Match,
  MatchEvent,
  NewsItem,
  Player,
  Standing,
  Team,
  WorldCupFact,
} from "@/lib/types";
import type { FootballProvider } from "./provider";
import {
  SEED_TEAMS,
  SEED_PLAYERS,
  SEED_EVENTS,
  SEED_NEWS,
  buildSeedMatches,
  buildSeedStandings,
} from "./seed-data";
import { FACTS_BANK } from "./facts-bank";

export class ManualProvider implements FootballProvider {
  readonly name = "manual";

  async getTeams(): Promise<Team[]> {
    return SEED_TEAMS;
  }

  async getPlayers(teamId?: string): Promise<Player[]> {
    return teamId ? SEED_PLAYERS.filter((p) => p.teamId === teamId) : SEED_PLAYERS;
  }

  async getMatches(): Promise<Match[]> {
    return buildSeedMatches(new Date());
  }

  async getMatch(id: string): Promise<Match | null> {
    return (await this.getMatches()).find((m) => m.id === id) ?? null;
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    return SEED_EVENTS[matchId] ?? [];
  }

  async getStandings(): Promise<Standing[]> {
    return buildSeedStandings(await this.getMatches());
  }

  async getNews(): Promise<NewsItem[]> {
    return SEED_NEWS;
  }

  async getFacts(): Promise<WorldCupFact[]> {
    return FACTS_BANK;
  }
}

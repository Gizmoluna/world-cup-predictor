// ---------------------------------------------------------------------------
// Seed data for the manual / fallback provider. Lets the whole app run with
// zero external API keys — real fixtures simply replace this once a provider
// key is configured. Teams/players are static; fixtures are generated relative
// to "now" so the Match Centre always has live/upcoming/finished examples.
// ---------------------------------------------------------------------------

import type {
  Match,
  MatchEvent,
  NewsItem,
  Player,
  Standing,
  Team,
} from "@/lib/types";

const flag = (code: string) =>
  `https://flagcdn.com/h120/${code}.png`;

export const SEED_TEAMS: Team[] = [
  { id: "col", name: "Colombia", shortName: "COL", flagUrl: flag("co"), groupName: "A", confederation: "CONMEBOL" },
  { id: "irl", name: "Ireland", shortName: "IRL", flagUrl: flag("ie"), groupName: "A", confederation: "UEFA" },
  { id: "arg", name: "Argentina", shortName: "ARG", flagUrl: flag("ar"), groupName: "A", confederation: "CONMEBOL" },
  { id: "jpn", name: "Japan", shortName: "JPN", flagUrl: flag("jp"), groupName: "A", confederation: "AFC" },
  { id: "bra", name: "Brazil", shortName: "BRA", flagUrl: flag("br"), groupName: "B", confederation: "CONMEBOL" },
  { id: "fra", name: "France", shortName: "FRA", flagUrl: flag("fr"), groupName: "B", confederation: "UEFA" },
  { id: "mar", name: "Morocco", shortName: "MAR", flagUrl: flag("ma"), groupName: "B", confederation: "CAF" },
  { id: "aus", name: "Australia", shortName: "AUS", flagUrl: flag("au"), groupName: "B", confederation: "AFC" },
  { id: "eng", name: "England", shortName: "ENG", flagUrl: flag("gb-eng"), groupName: "C", confederation: "UEFA" },
  { id: "esp", name: "Spain", shortName: "ESP", flagUrl: flag("es"), groupName: "C", confederation: "UEFA" },
  { id: "ger", name: "Germany", shortName: "GER", flagUrl: flag("de"), groupName: "C", confederation: "UEFA" },
  { id: "por", name: "Portugal", shortName: "POR", flagUrl: flag("pt"), groupName: "C", confederation: "UEFA" },
];

const P = (id: string, teamId: string, name: string, position: string): Player => ({
  id, teamId, name, position,
});

export const SEED_PLAYERS: Player[] = [
  P("col1", "col", "Luis Díaz", "FW"), P("col2", "col", "James Rodríguez", "MF"),
  P("col3", "col", "Jhon Durán", "FW"), P("col4", "col", "David Ospina", "GK"),
  P("irl1", "irl", "Evan Ferguson", "FW"), P("irl2", "irl", "Caoimhín Kelleher", "GK"),
  P("irl3", "irl", "Jayson Molumby", "MF"), P("irl4", "irl", "Nathan Collins", "DF"),
  P("arg1", "arg", "Lionel Messi", "FW"), P("arg2", "arg", "Julián Álvarez", "FW"),
  P("arg3", "arg", "Enzo Fernández", "MF"), P("arg4", "arg", "Emiliano Martínez", "GK"),
  P("jpn1", "jpn", "Takefusa Kubo", "FW"), P("jpn2", "jpn", "Wataru Endo", "MF"),
  P("bra1", "bra", "Vinícius Jr", "FW"), P("bra2", "bra", "Rodrygo", "FW"),
  P("bra3", "bra", "Bruno Guimarães", "MF"), P("bra4", "bra", "Alisson", "GK"),
  P("fra1", "fra", "Kylian Mbappé", "FW"), P("fra2", "fra", "Antoine Griezmann", "FW"),
  P("fra3", "fra", "Aurélien Tchouaméni", "MF"), P("fra4", "fra", "Mike Maignan", "GK"),
  P("mar1", "mar", "Achraf Hakimi", "DF"), P("mar2", "mar", "Brahim Díaz", "MF"),
  P("aus1", "aus", "Mathew Leckie", "FW"), P("aus2", "aus", "Mat Ryan", "GK"),
  P("eng1", "eng", "Harry Kane", "FW"), P("eng2", "eng", "Jude Bellingham", "MF"),
  P("eng3", "eng", "Bukayo Saka", "FW"), P("eng4", "eng", "Jordan Pickford", "GK"),
  P("esp1", "esp", "Lamine Yamal", "FW"), P("esp2", "esp", "Rodri", "MF"),
  P("esp3", "esp", "Nico Williams", "FW"), P("esp4", "esp", "Unai Simón", "GK"),
  P("ger1", "ger", "Florian Wirtz", "MF"), P("ger2", "ger", "Jamal Musiala", "MF"),
  P("ger3", "ger", "Kai Havertz", "FW"), P("ger4", "ger", "Manuel Neuer", "GK"),
  P("por1", "por", "Cristiano Ronaldo", "FW"), P("por2", "por", "Bruno Fernandes", "MF"),
  P("por3", "por", "Rafael Leão", "FW"), P("por4", "por", "Diogo Costa", "GK"),
];

const HOURS = 3600_000;

interface FixtureSeed {
  id: string;
  home: string;
  away: string;
  offsetHours: number; // relative to now; negative = past
  stage: Match["stage"];
  group?: string;
  venue: string;
  // for finished matches:
  home_score?: number;
  away_score?: number;
}

const FIXTURE_SEEDS: FixtureSeed[] = [
  // Finished
  { id: "f1", home: "arg", away: "jpn", offsetHours: -50, stage: "group", group: "A", venue: "MetLife Stadium", home_score: 3, away_score: 1 },
  { id: "f2", home: "col", away: "irl", offsetHours: -26, stage: "group", group: "A", venue: "SoFi Stadium", home_score: 2, away_score: 1 },
  { id: "f3", home: "bra", away: "aus", offsetHours: -24, stage: "group", group: "B", venue: "Estadio Azteca", home_score: 4, away_score: 0 },
  { id: "f4", home: "eng", away: "ger", offsetHours: -3, stage: "group", group: "C", venue: "AT&T Stadium", home_score: 1, away_score: 1 },
  // Live-ish (kicked off ~20 min ago)
  { id: "f5", home: "fra", away: "mar", offsetHours: -0.4, stage: "group", group: "B", venue: "Lincoln Financial Field", home_score: 1, away_score: 0 },
  // Upcoming today
  { id: "f6", home: "esp", away: "por", offsetHours: 4, stage: "group", group: "C", venue: "Levi's Stadium" },
  { id: "f7", home: "col", away: "arg", offsetHours: 7, stage: "group", group: "A", venue: "Hard Rock Stadium" },
  // Upcoming later
  { id: "f8", home: "irl", away: "jpn", offsetHours: 28, stage: "group", group: "A", venue: "Gillette Stadium" },
  { id: "f9", home: "ger", away: "esp", offsetHours: 31, stage: "group", group: "C", venue: "Arrowhead Stadium" },
  { id: "f10", home: "bra", away: "fra", offsetHours: 52, stage: "group", group: "B", venue: "Rose Bowl" },
  { id: "f11", home: "eng", away: "por", offsetHours: 76, stage: "quarter_final", venue: "MetLife Stadium" },
];

export function buildSeedMatches(now: Date): Match[] {
  const t = now.getTime();
  return FIXTURE_SEEDS.map((f) => {
    const kickoff = t + f.offsetHours * HOURS;
    let status: Match["status"];
    if (f.offsetHours > 0) status = "upcoming";
    else if (f.offsetHours > -2 && f.home_score == null) status = "live";
    else if (f.offsetHours > -2.2 && f.id === "f5") status = "live";
    else status = "full_time";

    const finished = status === "full_time" || status === "live";
    const homeScore = finished ? (f.home_score ?? 0) : null;
    const awayScore = finished ? (f.away_score ?? 0) : null;
    let winnerTeamId: string | null = null;
    if (status === "full_time" && homeScore != null && awayScore != null) {
      if (homeScore > awayScore) winnerTeamId = f.home;
      else if (awayScore > homeScore) winnerTeamId = f.away;
    }

    return {
      id: f.id,
      homeTeamId: f.home,
      awayTeamId: f.away,
      kickoffAt: new Date(kickoff).toISOString(),
      venue: f.venue,
      stage: f.stage,
      groupName: f.group ?? null,
      status,
      homeScore,
      awayScore,
      htHomeScore: status === "full_time" ? Math.floor((homeScore ?? 0) / 2) : null,
      htAwayScore: status === "full_time" ? Math.floor((awayScore ?? 0) / 2) : null,
      winnerTeamId,
      lastSyncedAt: now.toISOString(),
    } satisfies Match;
  });
}

// Hand-authored events for the finished matches (drives scorer/card scoring).
export const SEED_EVENTS: Record<string, MatchEvent[]> = {
  f1: [
    { id: "f1e1", matchId: "f1", minute: 14, type: "goal", teamId: "arg", playerId: "arg1" },
    { id: "f1e2", matchId: "f1", minute: 33, type: "goal", teamId: "arg", playerId: "arg2" },
    { id: "f1e3", matchId: "f1", minute: 58, type: "goal", teamId: "jpn", playerId: "jpn1" },
    { id: "f1e4", matchId: "f1", minute: 77, type: "goal", teamId: "arg", playerId: "arg1" },
    { id: "f1e5", matchId: "f1", minute: 64, type: "yellow_card", teamId: "jpn", playerId: "jpn2" },
    { id: "f1e6", matchId: "f1", minute: 90, type: "var", teamId: "arg", playerId: null, description: "VAR check: goal awarded" },
    { id: "f1e7", matchId: "f1", minute: 90, type: "goal", teamId: "arg", playerId: "arg1", description: "player_of_match" },
  ],
  f2: [
    { id: "f2e1", matchId: "f2", minute: 21, type: "goal", teamId: "col", playerId: "col1" },
    { id: "f2e2", matchId: "f2", minute: 55, type: "goal", teamId: "irl", playerId: "irl1" },
    { id: "f2e3", matchId: "f2", minute: 81, type: "penalty_goal", teamId: "col", playerId: "col2", description: "player_of_match" },
    { id: "f2e4", matchId: "f2", minute: 70, type: "yellow_card", teamId: "irl", playerId: "irl3" },
  ],
  f3: [
    { id: "f3e1", matchId: "f3", minute: 9, type: "goal", teamId: "bra", playerId: "bra1" },
    { id: "f3e2", matchId: "f3", minute: 27, type: "goal", teamId: "bra", playerId: "bra2" },
    { id: "f3e3", matchId: "f3", minute: 61, type: "goal", teamId: "bra", playerId: "bra1", description: "player_of_match" },
    { id: "f3e4", matchId: "f3", minute: 88, type: "goal", teamId: "bra", playerId: "bra3" },
  ],
  f4: [
    { id: "f4e1", matchId: "f4", minute: 39, type: "goal", teamId: "eng", playerId: "eng1" },
    { id: "f4e2", matchId: "f4", minute: 72, type: "goal", teamId: "ger", playerId: "ger3" },
    { id: "f4e3", matchId: "f4", minute: 66, type: "red_card", teamId: "eng", playerId: "eng3" },
    { id: "f4e4", matchId: "f4", minute: 80, type: "yellow_card", teamId: "ger", playerId: "ger1" },
  ],
  f5: [
    { id: "f5e1", matchId: "f5", minute: 12, type: "goal", teamId: "fra", playerId: "fra1" },
  ],
};

export const SEED_NEWS: NewsItem[] = [
  {
    id: "n1", title: "Mbappé fires France ahead against Morocco",
    summary: "Kylian Mbappé struck early to give France the lead in a tense Group B clash.",
    source: "Clash Wire", publishedAt: new Date().toISOString(),
    teamIds: ["fra", "mar"], category: "report",
  },
  {
    id: "n2", title: "Ireland's Ferguson passed fit for Japan showdown",
    summary: "Evan Ferguson trained fully and is expected to lead the line for Ireland.",
    source: "Clash Wire", publishedAt: new Date(Date.now() - 6 * HOURS).toISOString(),
    teamIds: ["irl"], category: "injury",
  },
  {
    id: "n3", title: "Colombia name unchanged XI after opening win",
    summary: "Buoyed by the win over Ireland, Colombia keep faith with the same lineup.",
    source: "Clash Wire", publishedAt: new Date(Date.now() - 10 * HOURS).toISOString(),
    teamIds: ["col"], category: "lineup",
  },
  {
    id: "n4", title: "England 1-1 Germany: honours even in instant classic",
    summary: "A Kane opener was cancelled out by Havertz as a red card shaped a dramatic draw.",
    source: "Clash Wire", publishedAt: new Date(Date.now() - 3 * HOURS).toISOString(),
    teamIds: ["eng", "ger"], category: "report",
  },
  {
    id: "n5", title: "Spain vs Portugal: Iberian heavyweight preview",
    summary: "Yamal and Ronaldo headline a blockbuster Group C decider in Santa Clara.",
    source: "Clash Wire", publishedAt: new Date(Date.now() - 1 * HOURS).toISOString(),
    teamIds: ["esp", "por"], category: "preview",
  },
];

export function buildSeedStandings(matches: Match[]): Standing[] {
  const byTeam = new Map<string, Standing>();
  const ensure = (teamId: string, group: string) => {
    if (!byTeam.has(teamId)) {
      byTeam.set(teamId, {
        teamId, groupName: group, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, rank: 0,
      });
    }
    return byTeam.get(teamId)!;
  };
  const teamGroup = new Map(SEED_TEAMS.map((t) => [t.id, t.groupName ?? "A"]));

  for (const m of matches) {
    if (m.status !== "full_time" || m.homeScore == null || m.awayScore == null) continue;
    if (m.stage !== "group") continue;
    const h = ensure(m.homeTeamId, teamGroup.get(m.homeTeamId) ?? "A");
    const a = ensure(m.awayTeamId, teamGroup.get(m.awayTeamId) ?? "A");
    h.played++; a.played++;
    h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; a.lost++; h.points += 3; }
    else if (m.homeScore < m.awayScore) { a.won++; h.lost++; a.points += 3; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }

  const list = [...byTeam.values()];
  for (const s of list) s.goalDifference = s.goalsFor - s.goalsAgainst;
  list.sort((x, y) =>
    x.groupName.localeCompare(y.groupName) ||
    y.points - x.points ||
    y.goalDifference - x.goalDifference ||
    y.goalsFor - x.goalsFor,
  );
  let group = "";
  let rank = 0;
  for (const s of list) {
    if (s.groupName !== group) { group = s.groupName; rank = 0; }
    s.rank = ++rank;
  }
  return list;
}

import { describe, it, expect } from "vitest";
import { topScorers, topPerformers, tournamentTotals, teamForm } from "./insights";
import type { Match, MatchEvent, Player, Team } from "./types";

const teams: Team[] = [
  { id: "arg", name: "Argentina", shortName: "ARG", flagUrl: "arg.png" },
  { id: "jpn", name: "Japan", shortName: "JPN", flagUrl: "jpn.png" },
];
const teamById = new Map(teams.map((t) => [t.id, t]));
const players: Player[] = [
  { id: "arg1", teamId: "arg", name: "Messi" },
  { id: "arg2", teamId: "arg", name: "Alvarez" },
  { id: "jpn1", teamId: "jpn", name: "Mitoma" },
];
const playerById = new Map(players.map((p) => [p.id, p]));

const events: MatchEvent[] = [
  { id: "1", matchId: "m1", minute: 14, type: "goal", teamId: "arg", playerId: "arg1" },
  { id: "2", matchId: "m1", minute: 33, type: "penalty_goal", teamId: "arg", playerId: "arg1" },
  { id: "3", matchId: "m1", minute: 58, type: "goal", teamId: "jpn", playerId: "jpn1" },
  { id: "4", matchId: "m1", minute: 77, type: "goal", teamId: "arg", playerId: "arg2" },
  { id: "5", matchId: "m1", minute: 64, type: "yellow_card", teamId: "jpn", playerId: "jpn1" },
  { id: "6", matchId: "m1", minute: 90, type: "goal", teamId: "arg", playerId: "arg1", description: "player_of_match" },
];

describe("topScorers (Golden Boot)", () => {
  it("ranks by goals and counts penalties", () => {
    const s = topScorers(events, playerById, teamById);
    expect(s[0]).toMatchObject({ playerId: "arg1", name: "Messi", goals: 3, penalties: 1, teamName: "ARG" });
    // 3, then a 1-1 tie kept in insertion order (jpn1's goal precedes arg2's).
    expect(s.map((r) => r.playerId)).toEqual(["arg1", "jpn1", "arg2"]);
  });
  it("ignores non-goal events", () => {
    const s = topScorers(events.filter((e) => e.type === "yellow_card"), playerById, teamById);
    expect(s).toEqual([]);
  });

  it("falls back to the event's player name when not in any roster (live feeds)", () => {
    // A scorer whose id isn't in playerById — name must come off the event.
    const liveEvents = [
      { id: "x", matchId: "m9", minute: 5, type: "goal" as const, teamId: "arg", playerId: "espn_99", playerName: "Lautaro" },
    ];
    const s = topScorers(liveEvents, playerById, teamById);
    expect(s[0]).toMatchObject({ playerId: "espn_99", name: "Lautaro", goals: 1, teamName: "ARG" });
  });
});

describe("topPerformers (Player of the Match)", () => {
  it("counts player_of_match awards", () => {
    const p = topPerformers(events, playerById, teamById);
    expect(p[0]).toMatchObject({ playerId: "arg1", name: "Messi", awards: 1 });
    expect(p).toHaveLength(1);
  });
});

describe("tournamentTotals", () => {
  const matches: Match[] = [
    { id: "m1", homeTeamId: "arg", awayTeamId: "jpn", kickoffAt: "2026-06-01T00:00:00Z", status: "full_time", stage: "group", homeScore: 3, awayScore: 1, venue: "" },
    { id: "m2", homeTeamId: "jpn", awayTeamId: "arg", kickoffAt: "2026-06-05T00:00:00Z", status: "upcoming", stage: "group", venue: "", homeScore: null, awayScore: null },
  ];
  it("sums goals + cards over finished matches only", () => {
    const t = tournamentTotals(matches, events);
    expect(t.matchesPlayed).toBe(1);
    expect(t.goals).toBe(4);
    expect(t.goalsPerMatch).toBe(4);
    expect(t.yellowCards).toBe(1);
    expect(t.biggestWin).toEqual({ matchId: "m1", margin: 2 });
  });
});

describe("teamForm", () => {
  const matches: Match[] = [
    { id: "m1", homeTeamId: "arg", awayTeamId: "jpn", kickoffAt: "2026-06-01T00:00:00Z", status: "full_time", stage: "group", homeScore: 3, awayScore: 1, venue: "" },
  ];
  it("records W/D/L and goals", () => {
    expect(teamForm("arg", matches)).toMatchObject({ played: 1, wins: 1, goalsFor: 3, goalsAgainst: 1, form: ["W"] });
    expect(teamForm("jpn", matches)).toMatchObject({ played: 1, losses: 1, form: ["L"] });
  });
});

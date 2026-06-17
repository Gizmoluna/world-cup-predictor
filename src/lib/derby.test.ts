import { describe, it, expect } from "vitest";
import { teamNameIndex, allegianceTeamIds, findDerbies } from "./derby";
import type { AppUser, Team } from "./types";

const teams: Team[] = [
  { id: "col", name: "Colombia", shortName: "COL", flagUrl: "" },
  { id: "irl", name: "Ireland", shortName: "IRL", flagUrl: "" },
  { id: "arg", name: "Argentina", shortName: "ARG", flagUrl: "" },
];
const idx = teamNameIndex(teams);

function u(id: string, over: Partial<AppUser> = {}): AppUser {
  return { id, name: id, theme: "carina", ...over };
}

describe("allegianceTeamIds", () => {
  it("picks up the backed team and country fields", () => {
    expect(allegianceTeamIds(u("a", { favouriteTeamId: "col" }), idx)).toEqual(new Set(["col"]));
    expect(allegianceTeamIds(u("b", { homeCountry: "Ireland" }), idx)).toEqual(new Set(["irl"]));
    // Dual allegiance: from Ireland, backs Colombia.
    expect(allegianceTeamIds(u("c", { homeCountry: "Ireland", favouriteTeamId: "col" }), idx)).toEqual(
      new Set(["col", "irl"]),
    );
  });
});

describe("findDerbies", () => {
  const match = { homeTeamId: "col", awayTeamId: "irl" };

  it("flags two friends on opposite sides", () => {
    const carina = u("carina", { favouriteTeamId: "col" });
    const johnny = u("johnny", { homeCountry: "Ireland" });
    expect(findDerbies(match, [carina, johnny], idx)).toEqual([
      { homeUserId: "carina", awayUserId: "johnny" },
    ]);
  });

  it("is silent when nobody covers a side", () => {
    expect(findDerbies(match, [u("x", { favouriteTeamId: "arg" })], idx)).toEqual([]);
  });

  it("does not pair a dual-allegiance person with themselves", () => {
    const both = u("both", { homeCountry: "Ireland", favouriteTeamId: "col" });
    expect(findDerbies(match, [both], idx)).toEqual([]);
  });

  it("dedupes mirror pairings", () => {
    // Both back both sides → only one derby between them, not two.
    const a = u("a", { favouriteTeamId: "col", adoptedCountry: "Ireland" });
    const b = u("b", { favouriteTeamId: "irl", adoptedCountry: "Colombia" });
    expect(findDerbies(match, [a, b], idx)).toHaveLength(1);
  });
});

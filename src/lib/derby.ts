// ---------------------------------------------------------------------------
// Homeland derby: when two friends' countries are drawn against each other, the
// match becomes personal — bragging rights on the line. Pure detection so it's
// easy to test and reuse across the match page, dashboard and notifications.
// ---------------------------------------------------------------------------

import type { AppUser, Team } from "@/lib/types";

/** Lowercased team name + short name → teamId, for matching user countries. */
export function teamNameIndex(teams: Team[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const t of teams) {
    idx.set(t.name.trim().toLowerCase(), t.id);
    if (t.shortName) idx.set(t.shortName.trim().toLowerCase(), t.id);
  }
  return idx;
}

/**
 * Every team a user is tied to: the team they back plus any country they've set
 * (home / adopted / favourite / nationality) that resolves to a team.
 */
export function allegianceTeamIds(user: AppUser, idx: Map<string, string>): Set<string> {
  const ids = new Set<string>();
  if (user.favouriteTeamId) ids.add(user.favouriteTeamId);
  for (const c of [user.homeCountry, user.adoptedCountry, user.favouriteCountry, user.nationality]) {
    const t = c ? idx.get(c.trim().toLowerCase()) : undefined;
    if (t) ids.add(t);
  }
  return ids;
}

export interface DerbyPair {
  /** The person whose country is the match's home side. */
  homeUserId: string;
  /** The person whose country is the match's away side. */
  awayUserId: string;
}

/**
 * Find every pairing of distinct people whose countries sit on opposite sides
 * of this match — i.e. a head-to-head homeland clash. Dedupes by the unordered
 * person-pair so dual-allegiance players don't produce mirror duplicates.
 */
export function findDerbies(
  match: { homeTeamId: string; awayTeamId: string },
  people: AppUser[],
  idx: Map<string, string>,
): DerbyPair[] {
  const onHome: string[] = [];
  const onAway: string[] = [];
  for (const p of people) {
    const ally = allegianceTeamIds(p, idx);
    if (ally.has(match.homeTeamId)) onHome.push(p.id);
    if (ally.has(match.awayTeamId)) onAway.push(p.id);
  }

  const seen = new Set<string>();
  const pairs: DerbyPair[] = [];
  for (const h of onHome) {
    for (const a of onAway) {
      if (h === a) continue; // same person backing both sides — not a derby
      const key = h < a ? `${h}|${a}` : `${a}|${h}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ homeUserId: h, awayUserId: a });
    }
  }
  return pairs;
}

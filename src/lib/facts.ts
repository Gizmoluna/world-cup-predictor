// ---------------------------------------------------------------------------
// Live facts — derived from the current tournament + league data. These update
// automatically as fixtures sync and results come in (that's the "updated from
// somewhere"), and combine with the evergreen bank for a long scrollable feed.
// Pure given (model, now): testable, no I/O.
// ---------------------------------------------------------------------------

import "server-only";
import type { ReadModel } from "@/lib/aggregate";
import type { WorldCupFact } from "@/lib/types";
import { chrome } from "@/lib/display";

const fact = (id: string, text: string, category: WorldCupFact["category"]): WorldCupFact => ({
  id,
  text,
  category,
  source: "Live data",
  live: true,
});

export function computeDerivedFacts(model: ReadModel, now: Date = new Date()): WorldCupFact[] {
  const out: WorldCupFact[] = [];
  const name = (id: string) => model.teamById.get(id)?.name ?? id;

  const finished = model.matches.filter(
    (m) => m.status === "full_time" && m.homeScore != null && m.awayScore != null,
  );
  const upcoming = model.matches
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt));
  const live = model.matches.filter((m) => m.status === "live");

  // --- tournament totals -------------------------------------------------
  const totalGoals = finished.reduce((s, m) => s + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  out.push(
    fact("d_played", `${finished.length} of ${model.matches.length} matches have been played so far.`, "live"),
  );
  if (finished.length) {
    out.push(fact("d_goals", `${totalGoals} goals scored across ${finished.length} matches — an average of ${(totalGoals / finished.length).toFixed(1)} per game.`, "live"));
  }
  if (live.length) {
    out.push(fact("d_live", `${live.length} match${live.length > 1 ? "es are" : " is"} live right now. ⚡`, "live"));
  }

  // --- biggest win & highest scoring -------------------------------------
  let biggest: typeof finished[number] | null = null;
  let highest: typeof finished[number] | null = null;
  for (const m of finished) {
    const margin = Math.abs((m.homeScore ?? 0) - (m.awayScore ?? 0));
    const total = (m.homeScore ?? 0) + (m.awayScore ?? 0);
    if (!biggest || margin > Math.abs((biggest.homeScore ?? 0) - (biggest.awayScore ?? 0))) biggest = m;
    if (!highest || total > (highest.homeScore ?? 0) + (highest.awayScore ?? 0)) highest = m;
  }
  if (biggest && Math.abs((biggest.homeScore ?? 0) - (biggest.awayScore ?? 0)) > 0) {
    out.push(fact("d_biggest", `Biggest win so far: ${name(biggest.homeTeamId)} ${biggest.homeScore}-${biggest.awayScore} ${name(biggest.awayTeamId)}.`, "live"));
  }
  if (highest) {
    out.push(fact("d_highest", `Highest-scoring match: ${name(highest.homeTeamId)} ${highest.homeScore}-${highest.awayScore} ${name(highest.awayTeamId)} (${(highest.homeScore ?? 0) + (highest.awayScore ?? 0)} goals).`, "live"));
  }

  // --- per-team goals & clean sheets -------------------------------------
  const scored = new Map<string, number>();
  const conceded = new Map<string, number>();
  const cleanSheets = new Map<string, number>();
  const add = (map: Map<string, number>, k: string, n: number) => map.set(k, (map.get(k) ?? 0) + n);
  for (const m of finished) {
    add(scored, m.homeTeamId, m.homeScore ?? 0);
    add(scored, m.awayTeamId, m.awayScore ?? 0);
    add(conceded, m.homeTeamId, m.awayScore ?? 0);
    add(conceded, m.awayTeamId, m.homeScore ?? 0);
    if (m.awayScore === 0) add(cleanSheets, m.homeTeamId, 1);
    if (m.homeScore === 0) add(cleanSheets, m.awayTeamId, 1);
  }
  const topScorer = [...scored.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topScorer && topScorer[1] > 0) {
    out.push(fact("d_topteam", `${name(topScorer[0])} have scored the most goals so far (${topScorer[1]}).`, "live"));
  }
  const topCleanSheet = [...cleanSheets.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCleanSheet) {
    out.push(fact("d_clean", `${name(topCleanSheet[0])} have kept the most clean sheets (${topCleanSheet[1]}).`, "live"));
  }

  // --- group leaders -----------------------------------------------------
  const groupPts = new Map<string, Map<string, number>>(); // group -> team -> pts
  for (const m of finished.filter((x) => x.stage === "group" && x.groupName)) {
    const g = m.groupName!;
    if (!groupPts.has(g)) groupPts.set(g, new Map());
    const tbl = groupPts.get(g)!;
    const h = m.homeScore ?? 0;
    const a = m.awayScore ?? 0;
    const bump = (id: string, p: number) => tbl.set(id, (tbl.get(id) ?? 0) + p);
    if (h > a) { bump(m.homeTeamId, 3); bump(m.awayTeamId, 0); }
    else if (a > h) { bump(m.awayTeamId, 3); bump(m.homeTeamId, 0); }
    else { bump(m.homeTeamId, 1); bump(m.awayTeamId, 1); }
  }
  for (const [g, tbl] of [...groupPts.entries()].sort()) {
    const leader = [...tbl.entries()].sort((a, b) => b[1] - a[1])[0];
    if (leader) out.push(fact(`d_group_${g}`, `Group ${g} is led by ${name(leader[0])} on ${leader[1]} point${leader[1] === 1 ? "" : "s"}.`, "live"));
  }

  // --- next fixtures -----------------------------------------------------
  if (upcoming[0]) {
    out.push(fact("d_next", `Next up: ${name(upcoming[0].homeTeamId)} v ${name(upcoming[0].awayTeamId)} at ${upcoming[0].venue ?? "TBC"}.`, "live"));
  }

  // --- rivalry / league facts -------------------------------------------
  const lb = model.leaderboard;
  if (lb.length >= 1 && lb[0].played > 0) {
    const top = lb[0];
    const c = chrome(top.user);
    out.push(fact("d_leader", `${c.flag} ${c.name} leads the league on ${top.points} points.`, "rivalry"));
    if (lb.length >= 2) {
      const gap = top.points - lb[1].points;
      out.push(fact("d_gap", gap === 0 ? `The league is dead level at the top on ${top.points} points.` : `${chrome(top.user).name} leads ${chrome(lb[1].user).name} by ${gap} point${gap === 1 ? "" : "s"}.`, "rivalry"));
    }
  }
  for (const row of lb) {
    const c = chrome(row.user);
    if (row.exactScores > 0) out.push(fact(`d_exact_${row.user.id}`, `${c.flag} ${c.name} has nailed ${row.exactScores} exact scoreline${row.exactScores === 1 ? "" : "s"}.`, "rivalry"));
    if (row.perfectPicks > 0) out.push(fact(`d_perfect_${row.user.id}`, `${c.flag} ${c.name} has ${row.perfectPicks} perfect prediction${row.perfectPicks === 1 ? "" : "s"} (score + first scorer).`, "rivalry"));
    if (row.currentStreak >= 2) out.push(fact(`d_streak_${row.user.id}`, `${c.flag} ${c.name} is on a ${row.currentStreak}-match winning streak! 🔥`, "rivalry"));
  }

  // most-backed team
  const backed = new Map<string, number>();
  for (const p of model.predictions) if (p.predictedWinnerTeamId) add(backed, p.predictedWinnerTeamId, 1);
  const topBacked = [...backed.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topBacked) out.push(fact("d_backed", `${name(topBacked[0])} are the most-backed team to win among players (${topBacked[1]} pick${topBacked[1] === 1 ? "" : "s"}).`, "rivalry"));

  void now;
  return out;
}

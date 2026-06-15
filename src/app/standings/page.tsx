import { requireUser } from "@/lib/session";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { StandingsView } from "@/components/standings-view";
import type { Standing, Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const user = await requireUser();
  const provider = getProvider();
  const [standings, teams] = await Promise.all([provider.getStandings(), provider.getTeams()]);
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t] as [string, Team]));

  // Group + sort.
  const groups = new Map<string, Standing[]>();
  for (const s of standings) {
    if (!groups.has(s.groupName)) groups.set(s.groupName, []);
    groups.get(s.groupName)!.push(s);
  }
  for (const list of groups.values()) {
    list.sort(
      (a, b) =>
        (a.rank || 99) - (b.rank || 99) ||
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor,
    );
  }

  // Put the group of the team you support first.
  const favGroup = standings.find((s) => s.teamId === user.favouriteTeamId)?.groupName;
  const ordered = [...groups.entries()].sort((a, b) => {
    if (a[0] === favGroup) return -1;
    if (b[0] === favGroup) return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-black">Group Standings</h1>
      <p className="mb-4 text-sm text-muted">
        {ordered.length ? "Live tables · top 2 advance" : "Standings will appear once the group stage is under way."}
      </p>
      <StandingsView
        groups={ordered.map(([name, rows]) => ({ name, rows }))}
        teamById={teamById}
        favouriteTeamId={user.favouriteTeamId ?? null}
      />
    </AppShell>
  );
}

import Link from "next/link";
import { Medal } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { StandingsView } from "@/components/standings-view";
import { SectionNav } from "@/components/section-nav";
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
      <div className="mb-1 flex items-center justify-between">
        <h1 className="title-bc text-3xl">Group Standings</h1>
        <Link
          href="/predict-groups"
          className="flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent)]"
        >
          <Medal size={14} /> Predict winners
        </Link>
      </div>
      <p className="mb-3 text-sm text-muted">
        {ordered.length ? "Live tables · top 2 advance · tap a team for its page" : "Standings will appear once the group stage is under way."}
      </p>
      <SectionNav active="/standings" />
      <StandingsView
        groups={ordered.map(([name, rows]) => ({ name, rows }))}
        teamById={teamById}
        favouriteTeamId={user.favouriteTeamId ?? null}
      />
    </AppShell>
  );
}

import { requireUser } from "@/lib/session";
import { getProvider } from "@/lib/football-api/provider";
import { getUserGroupOrders } from "@/lib/group-orders";
import { AppShell } from "@/components/app-shell";
import { StandingsPicker } from "@/components/standings-picker";
import type { Standing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PredictStandingsPage() {
  const user = await requireUser();
  const [standings, teams, orders] = await Promise.all([
    getProvider().getStandings(),
    getProvider().getTeams(),
    getUserGroupOrders(user.id),
  ]);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const orderByGroup = new Map(orders.map((o) => [o.groupName, o.teamIds]));
  const orderMeta = new Map(orders.map((o) => [o.groupName, o]));

  const byGroup = new Map<string, Standing[]>();
  for (const s of standings) {
    if (!byGroup.has(s.groupName)) byGroup.set(s.groupName, []);
    byGroup.get(s.groupName)!.push(s);
  }

  const groups = [...byGroup.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, rows]) => {
      const ordered = [...rows].sort(
        (a, b) => (a.rank || 99) - (b.rank || 99) || b.points - a.points || b.goalDifference - a.goalDifference,
      );
      const decided = rows.length >= 3 && rows.every((r) => r.played >= 3);
      return {
        name,
        decidedOrder: decided ? ordered.map((r) => r.teamId) : null,
        savedOrder: orderByGroup.get(name) ?? [],
        changeCount: orderMeta.get(name)?.changeCount ?? 0,
        penalty: orderMeta.get(name)?.penalty ?? 0,
        teams: ordered.map((r) => {
          const t = teamById.get(r.teamId);
          return { id: r.teamId, name: t?.shortName ?? t?.name ?? r.teamId, flagUrl: t?.flagUrl ?? "" };
        }),
      };
    });

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">Group Standings 🔮</h1>
      <p className="mb-4 text-sm text-muted">
        {groups.length
          ? "Tap teams 1→4 to predict each group's finish · 1st +10, 2nd +5, 3rd/4th +3, all four +5"
          : "Groups appear once the draw is in the data."}
      </p>
      <StandingsPicker groups={groups} />
    </AppShell>
  );
}

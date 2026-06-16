import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getUserGroupPredictions } from "@/lib/group-predictions";
import { AppShell } from "@/components/app-shell";
import { GroupPicks } from "@/components/group-picks";
import type { Standing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PredictGroupsPage() {
  const user = await requireUser();
  const [model, picks] = await Promise.all([getReadModel(), getUserGroupPredictions(user.id)]);
  const pickByGroup = new Map(picks.map((p) => [p.groupName, p]));

  const byGroup = new Map<string, Standing[]>();
  for (const s of model.standings) {
    if (!byGroup.has(s.groupName)) byGroup.set(s.groupName, []);
    byGroup.get(s.groupName)!.push(s);
  }

  const groups = [...byGroup.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, rows]) => ({
      name,
      decidedWinnerId: model.decidedGroupWinners.get(name) ?? null,
      pickedId: pickByGroup.get(name)?.teamId ?? null,
      changeCount: pickByGroup.get(name)?.changeCount ?? 0,
      penalty: pickByGroup.get(name)?.penalty ?? 0,
      teams: [...rows]
        .sort((a, b) => (a.rank || 99) - (b.rank || 99) || b.points - a.points)
        .map((r) => {
          const t = model.teamById.get(r.teamId);
          return { id: r.teamId, name: t?.shortName ?? t?.name ?? r.teamId, flagUrl: t?.flagUrl ?? "" };
        }),
    }));

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">Predict Group Winners 🥇</h1>
      <p className="mb-4 text-sm text-muted">
        {groups.length
          ? "Pick who tops each group · +10 pts each · changing costs escalating points, paid to loyal rivals"
          : "Groups will appear once the draw is in the data."}
      </p>
      <GroupPicks groups={groups} />
    </AppShell>
  );
}

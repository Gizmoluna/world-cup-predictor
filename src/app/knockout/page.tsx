import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getUserKnockoutPredictions } from "@/lib/knockout-predictions";
import { AppShell } from "@/components/app-shell";
import { KnockoutPicks } from "@/components/knockout-picks";

export const dynamic = "force-dynamic";

const ORDER: Record<string, number> = {
  round_of_32: 1,
  round_of_16: 2,
  quarter_final: 3,
  semi_final: 4,
  third_place: 5,
  final: 6,
};

export default async function KnockoutPage() {
  const user = await requireUser();
  const [model, picks] = await Promise.all([getReadModel(), getUserKnockoutPredictions(user.id)]);
  const pickByMatch = new Map(picks.map((p) => [p.matchId, p]));

  const matches = model.matches
    .filter((m) => m.stage !== "group")
    .sort((a, b) => (ORDER[a.stage] ?? 9) - (ORDER[b.stage] ?? 9) || +new Date(a.kickoffAt) - +new Date(b.kickoffAt));

  const items = matches.map((m) => {
    const home = model.teamById.get(m.homeTeamId);
    const away = model.teamById.get(m.awayTeamId);
    const pick = pickByMatch.get(m.id);
    return {
      matchId: m.id,
      stage: m.stage,
      ready: Boolean(home?.flagUrl && away?.flagUrl),
      locked: m.status !== "upcoming",
      winnerId: m.status === "full_time" ? m.winnerTeamId ?? null : null,
      pickedId: pick?.teamId ?? null,
      changeCount: pick?.changeCount ?? 0,
      home: home ? { id: home.id, name: home.shortName ?? home.name, flagUrl: home.flagUrl } : null,
      away: away ? { id: away.id, name: away.shortName ?? away.name, flagUrl: away.flagUrl } : null,
    };
  });

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">Knockout Bracket 🏆</h1>
      <p className="mb-4 text-sm text-muted">
        {items.length
          ? "Pick each winner · +8 pts each · change a pick = −2 pts"
          : "Knockout fixtures appear once the bracket is set."}
      </p>
      <KnockoutPicks items={items} />
    </AppShell>
  );
}

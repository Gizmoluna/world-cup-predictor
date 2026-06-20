import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { topScorers, topPerformers, tournamentTotals, type ScorerRow } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-3 text-center">
      <span className={cn("num-bc text-2xl font-black", tone)}>{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}

export default async function InsightsPage() {
  await requireUser();
  const provider = getProvider();
  const model = await getReadModel();

  // Events for every finished match → drives the Golden Boot + performers.
  const finished = model.matches.filter((m) => m.status === "full_time");
  const eventLists = await Promise.all(finished.map((m) => provider.getMatchEvents(m.id)));
  const events = eventLists.flat();

  const totals = tournamentTotals(model.matches, events);
  const performers = topPerformers(events, model.playerById, model.teamById);

  // Golden Boot: prefer the provider's live leaders (richer, has assists); fall
  // back to goals computed from events so the demo/seed is never empty.
  const leaders = await provider.getLeaders().catch(() => ({ scorers: [], assists: [] }));
  const computed = topScorers(events, model.playerById, model.teamById);
  const scorers: ScorerRow[] =
    leaders.scorers.length > 0
      ? leaders.scorers.map((s) => ({
          playerId: s.playerId,
          name: s.name,
          teamId: null,
          teamName: s.teamName ?? null,
          teamFlagUrl: s.teamFlagUrl ?? null,
          goals: s.value,
          penalties: 0,
        }))
      : computed;
  const assists = leaders.assists;

  const maxGoals = scorers[0]?.goals || 1;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="title-bc text-3xl">Insights</h1>
        <Link href="/standings" className="text-xs font-bold text-[var(--accent)]">Standings →</Link>
      </div>

      <div className="flex flex-col gap-5">
        {/* Tournament pulse */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Tournament pulse</CardTitle>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Matches" value={totals.matchesPlayed} />
            <Stat label="Goals" value={totals.goals} tone="text-pitch" />
            <Stat label="Goals / match" value={totals.goalsPerMatch} tone="text-pitch" />
            <Stat label="Yellows" value={totals.yellowCards} tone="text-gold" />
            <Stat label="Reds" value={totals.redCards} tone="text-danger" />
            <Stat label="Penalties" value={totals.penalties} />
          </div>
        </Card>

        {/* Golden Boot */}
        <Card className="flex flex-col gap-3">
          <CardTitle>🥇 Golden Boot race</CardTitle>
          {scorers.length === 0 ? (
            <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">
              No goals yet — the race starts at kickoff.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {scorers.slice(0, 10).map((s, i) => (
                <Link
                  key={s.playerId}
                  href={`/players/${s.playerId}`}
                  className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5 transition active:scale-[0.99]"
                >
                  <span className="num-bc w-5 text-center text-sm text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{s.name}</p>
                    <p className="text-[11px] text-muted">
                      {s.teamName ?? "—"}{s.penalties > 0 ? ` · ${s.penalties} pen` : ""}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-pitch" style={{ width: `${(s.goals / maxGoals) * 100}%` }} />
                    </div>
                  </div>
                  <span className="num-bc text-xl font-black text-pitch">{s.goals}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Top assists — only when the provider supplies them (no assist events) */}
        {assists.length > 0 && (
          <Card className="flex flex-col gap-3">
            <CardTitle>🅰️ Top assists</CardTitle>
            <div className="flex flex-col gap-2">
              {assists.slice(0, 10).map((a, i) => (
                <div key={a.playerId} className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
                  <span className="num-bc w-5 text-center text-sm text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{a.name}</p>
                    <p className="text-[11px] text-muted">{a.teamName ?? "—"}</p>
                  </div>
                  <span className="num-bc text-xl font-black text-[var(--accent)]">{a.value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top performers */}
        <Card className="flex flex-col gap-3">
          <CardTitle>⭐ Top performers</CardTitle>
          {performers.length === 0 ? (
            <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">
              Player-of-the-Match awards show here once matches finish.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {performers.map((p, i) => (
                <Link key={p.playerId} href={`/players/${p.playerId}`} className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5 transition active:scale-[0.99]">
                  <span className="num-bc w-5 text-center text-sm text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-[11px] text-muted">{p.teamName ?? "—"}</p>
                  </div>
                  <span className="text-sm font-bold text-gold">⭐ {p.awards}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

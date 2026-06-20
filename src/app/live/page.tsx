import Link from "next/link";
import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { MatchCard, type Predictor } from "@/components/match-card";
import { LiveRefresher } from "@/components/live-refresher";
import { Card } from "@/components/ui/card";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const model = await getReadModel(league ? { leagueId: league.id } : { restrictUserIds: members.map((m) => m.id) });

  const predictors = (matchId: string): Predictor[] =>
    members.map((m) => ({
      id: m.id,
      flag: chrome(m).flag,
      name: m.name,
      did: model.predictions.some((p) => p.userId === m.id && p.matchId === matchId),
    }));

  const live = model.matches
    .filter((m) => m.status === "live")
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt));

  const upcoming = model.matches
    .filter((m) => m.status === "upcoming")
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    .slice(0, 4);

  return (
    <AppShell>
      <LiveRefresher active={live.length > 0} />
      <div className="mb-4 flex items-center gap-2">
        <h1 className="title-bc text-3xl">Live</h1>
        {live.length > 0 && (
          <span className="rounded-full bg-danger/25 px-2.5 py-1 text-[11px] font-black text-danger">● {live.length} on now</span>
        )}
      </div>

      {live.length > 0 ? (
        <section className="flex flex-col gap-2">
          {live.map((m) => (
            <Link key={m.id} href={`/matches/${m.id}`} className="block rounded-2xl ring-1 ring-danger/40 transition active:scale-[0.99]">
              <MatchCard
                match={m}
                home={model.teamById.get(m.homeTeamId)}
                away={model.teamById.get(m.awayTeamId)}
                predictors={predictors(m.id)}
              />
            </Link>
          ))}
          <p className="px-1 pt-1 text-xs text-muted">
            Tap a match for its Live Center — who&apos;s winning it on points right now.
          </p>
        </section>
      ) : (
        <Card className="flex items-center gap-3">
          <span className="text-2xl">😴</span>
          <p className="text-sm font-semibold">No matches live right now. Here&apos;s what&apos;s next 👇</p>
        </Card>
      )}

      {upcoming.length > 0 && (
        <section className="mt-5 flex flex-col gap-2">
          <h2 className="title-bc px-1 text-sm text-muted">Up next</h2>
          {upcoming.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              home={model.teamById.get(m.homeTeamId)}
              away={model.teamById.get(m.awayTeamId)}
              predictors={predictors(m.id)}
            />
          ))}
        </section>
      )}
    </AppShell>
  );
}

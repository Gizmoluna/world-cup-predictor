import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { MatchFilter } from "@/components/match-filter";
import { TournamentHub } from "@/components/tournament-hub";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const model = await getReadModel(league ? { leagueId: league.id } : { restrictUserIds: [user.id] });

  const items = model.matches
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt))
    .map((m) => ({
      match: m,
      home: model.teamById.get(m.homeTeamId),
      away: model.teamById.get(m.awayTeamId),
      predictors: members.map((mem) => ({
        id: mem.id,
        flag: chrome(mem).flag,
        name: mem.name,
        did: model.predictions.some((p) => p.userId === mem.id && p.matchId === m.id),
      })),
    }));

  const groups = Array.from(
    new Set(model.matches.map((m) => m.groupName).filter(Boolean) as string[]),
  ).sort();

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="title-bc text-3xl">Match Centre</h1>
        <Link
          href="/standings"
          className="flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent)]"
        >
          <BarChart3 size={14} /> Standings
        </Link>
      </div>

      {/* Predict the tournament: group standings, knockouts, finals + duels. */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Predict the tournament</p>
        <TournamentHub />
      </div>

      <MatchFilter items={items} groups={groups} favouriteTeamId={user.favouriteTeamId ?? null} />
    </AppShell>
  );
}

import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { MatchFilter } from "@/components/match-filter";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const model = await getReadModel({ restrictUserIds: members.map((m) => m.id) });

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
      <h1 className="mb-4 text-2xl font-black">Match Centre</h1>
      <MatchFilter items={items} groups={groups} />
    </AppShell>
  );
}

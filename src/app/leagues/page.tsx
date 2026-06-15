import { requireUser, getActiveLeague } from "@/lib/session";
import { getUserLeagues, getLeagueMembers } from "@/lib/leagues";
import { AppShell } from "@/components/app-shell";
import { LeaguesPanel } from "@/components/leagues-panel";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const user = await requireUser();
  const [leagues, active] = await Promise.all([
    getUserLeagues(user.id),
    getActiveLeague(user.id),
  ]);

  const withCounts = await Promise.all(
    leagues.map(async (l) => ({
      id: l.id,
      name: l.name,
      inviteCode: l.inviteCode,
      isOwner: l.ownerId === user.id,
      isActive: l.id === active?.id,
      memberCount: (await getLeagueMembers(l.id)).length,
    })),
  );

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">Leagues</h1>
      <p className="mb-4 text-sm text-muted">
        Play with friends. Create a league, share the code, and battle it out.
      </p>
      <LeaguesPanel leagues={withCounts} />
    </AppShell>
  );
}

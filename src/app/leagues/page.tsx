import { requireUser, getActiveLeague } from "@/lib/session";
import {
  getUserLeagues,
  getLeagueMembers,
  getDiscoverableLeagues,
  getMyPendingLeagueIds,
  getPendingRequests,
  getAllLeagues,
} from "@/lib/leagues";
import { getUser, getUsers } from "@/lib/data";
import { chrome } from "@/lib/display";
import { isAdmin } from "@/lib/constants";
import { AppShell } from "@/components/app-shell";
import { LeaguesPanel } from "@/components/leagues-panel";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const user = await requireUser();
  const [leagues, active, discoverRaw, myPending] = await Promise.all([
    getUserLeagues(user.id),
    getActiveLeague(user.id),
    getDiscoverableLeagues(user.id),
    getMyPendingLeagueIds(user.id),
  ]);
  const pendingSet = new Set(myPending);

  const withCounts = await Promise.all(
    leagues.map(async (l) => {
      const isOwner = l.ownerId === user.id;
      // For leagues you own, surface pending join requests.
      let requests: { id: string; name: string; flag: string }[] = [];
      if (isOwner) {
        const ids = await getPendingRequests(l.id);
        const users = await Promise.all(ids.map((id) => getUser(id)));
        requests = users
          .filter((u): u is NonNullable<typeof u> => Boolean(u))
          .map((u) => ({ id: u.id, name: u.name, flag: chrome(u).flag }));
      }
      return {
        id: l.id,
        name: l.name,
        inviteCode: l.inviteCode,
        isOwner,
        isActive: l.id === active?.id,
        memberCount: (await getLeagueMembers(l.id)).length,
        requests,
      };
    }),
  );

  const discover = await Promise.all(
    discoverRaw.map(async (l) => ({
      id: l.id,
      name: l.name,
      memberCount: (await getLeagueMembers(l.id)).length,
      requested: pendingSet.has(l.id),
    })),
  );

  const [allUsers, allLeagues] = await Promise.all([getUsers(), getAllLeagues()]);

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">Leagues</h1>
      <p className="mb-1 text-sm text-muted">
        Play with friends. Create a league, share the code, or request to join others.
      </p>
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
        {allUsers.length} player{allUsers.length === 1 ? "" : "s"} · {allLeagues.length} league
        {allLeagues.length === 1 ? "" : "s"}
      </p>
      <LeaguesPanel leagues={withCounts} discover={discover} isAdmin={isAdmin(user.id)} />
    </AppShell>
  );
}

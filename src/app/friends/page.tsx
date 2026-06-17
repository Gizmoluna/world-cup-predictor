import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getUsers, getUser } from "@/lib/data";
import { getFriendIds, getIncomingRequests, getFriendStateMap } from "@/lib/friends";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FriendRequests } from "@/components/friend-requests";
import { FriendButton } from "@/components/friend-button";
import { PickHistory, type PickRow } from "@/components/pick-history";
import { rankFor } from "@/lib/constants";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = await requireUser();
  const model = await getReadModel();

  const [friendIds, incomingIds, stateMap, allUsers] = await Promise.all([
    getFriendIds(user.id),
    getIncomingRequests(user.id),
    getFriendStateMap(user.id),
    getUsers(),
  ]);

  const friends = (await Promise.all(friendIds.map((id) => getUser(id)))).filter(
    (u): u is NonNullable<typeof u> => Boolean(u),
  );
  const incoming = (await Promise.all(incomingIds.map((id) => getUser(id))))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => ({ id: u.id, name: u.name, flag: chrome(u).flag }));

  const pointsById = new Map(model.leaderboard.map((r) => [r.user.id, r.points]));
  const matchById = new Map(model.matches.map((m) => [m.id, m]));

  // Each friend's last few *finished* picks, with result + points — a quick
  // window into how they're playing without leaving the hub.
  function recentPicks(friendId: string): PickRow[] {
    return model.predictions
      .filter((p) => p.userId === friendId)
      .map((p) => {
        const m = matchById.get(p.matchId);
        if (!m || m.status !== "full_time") return null;
        const home = model.teamById.get(m.homeTeamId);
        const away = model.teamById.get(m.awayTeamId);
        const score = model.scoresByMatch.get(m.id)?.find((s) => s.userId === friendId);
        return {
          matchId: m.id,
          home: home?.shortName ?? home?.name ?? m.homeTeamId,
          away: away?.shortName ?? away?.name ?? m.awayTeamId,
          homeFlag: home?.flagUrl ?? "",
          awayFlag: away?.flagUrl ?? "",
          kickoff: m.kickoffAt,
          status: m.status,
          predHome: p.predictedHomeScore ?? null,
          predAway: p.predictedAwayScore ?? null,
          scorerName: null,
          actual: `${m.homeScore}-${m.awayScore}`,
          points: score ? score.totalPoints : null,
          hidden: false,
        } as PickRow;
      })
      .filter((r): r is PickRow => Boolean(r))
      .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff))
      .slice(0, 3);
  }

  // People you could add: everyone you have no relationship with yet.
  const suggestions = allUsers
    .filter((u) => u.id !== user.id && !stateMap.has(u.id))
    .slice(0, 12);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="title-bc text-3xl">Friends</h1>
        <Badge tone="accent">{friends.length}</Badge>
      </div>

      <div className="flex flex-col gap-5">
        {/* Pending invitations — accept right here */}
        {incoming.length > 0 && (
          <Card className="flex flex-col gap-3 ring-1 ring-[var(--accent)]/50">
            <CardTitle>Friend requests ({incoming.length})</CardTitle>
            <FriendRequests requests={incoming} />
          </Card>
        )}

        {/* Your friends + a peek at their recent picks */}
        {friends.length === 0 ? (
          <Card className="text-sm text-muted">
            No friends yet. Add a few below — then you&apos;ll see their picks and points here.
          </Card>
        ) : (
          friends.map((f) => {
            const c = chrome(f);
            const pts = pointsById.get(f.id) ?? 0;
            const rank = rankFor(pts);
            const picks = recentPicks(f.id);
            return (
              <Card key={f.id} className="flex flex-col gap-3">
                <Link
                  href={`/profile/${f.id}`}
                  className="flex items-center gap-3 transition active:scale-[0.99]"
                >
                  <span className="text-3xl">{c.flag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="title-bc truncate text-lg">{f.name}</p>
                    <p className="text-[11px] text-muted">
                      {rank.icon} {rank.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="num-bc block text-2xl leading-none text-[var(--accent)]">{pts}</span>
                    <span className="text-[10px] uppercase tracking-wide text-muted">pts</span>
                  </div>
                  <ChevronRight size={16} className="text-muted" />
                </Link>

                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Recent picks
                  </p>
                  <PickHistory rows={picks} emptyNote="No finished picks yet." />
                </div>
              </Card>
            );
          })
        )}

        {/* Find people to add */}
        {suggestions.length > 0 && (
          <Card className="flex flex-col gap-3">
            <CardTitle>Add friends</CardTitle>
            <div className="flex flex-col divide-y divide-border">
              {suggestions.map((u) => {
                const c = chrome(u);
                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link
                      href={`/profile/${u.id}`}
                      className="flex min-w-0 items-center gap-2 text-sm font-bold"
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="truncate">{u.name}</span>
                    </Link>
                    <FriendButton targetId={u.id} state={stateMap.get(u.id) ?? "none"} />
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

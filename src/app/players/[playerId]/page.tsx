import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { TeamFlag } from "@/components/team-flag";
import { topScorers } from "@/lib/insights";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const user = await requireUser();
  const provider = getProvider();
  const model = await getReadModel();

  let player = model.playerById.get(playerId);
  // Player may not be in the read model's cache — try the team rosters.
  if (!player) {
    const fromApi = (await provider.getPlayers()).find((p) => p.id === playerId);
    if (fromApi) player = fromApi;
  }
  if (!player) notFound();

  const team = model.teamById.get(player.teamId);

  // This player's goals across finished matches.
  const finished = model.matches.filter((m) => m.status === "full_time");
  const events = (await Promise.all(finished.map((m) => provider.getMatchEvents(m.id)))).flat();
  const scoring = topScorers(events, model.playerById, model.teamById).find((s) => s.playerId === playerId);
  const goals = scoring?.goals ?? 0;

  // Who in your league is tied to this player (Golden Boot pick, favourite, or
  // predicted them as a goalscorer on a match).
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const memberIds = new Set(members.map((m) => m.id));
  const goldenBooters = members.filter((m) => m.goldenBootPickId === playerId);
  const favouritedBy = members.filter((m) => m.favouritePlayerId === playerId);
  const backedOnMatch = model.predictions.filter(
    (p) =>
      memberIds.has(p.userId) &&
      (p.firstGoalScorerId === playerId || p.anytimeGoalScorerId === playerId),
  ).length;

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-surface-2 text-3xl">
            {player.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.imageUrl} alt={player.name} className="h-full w-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black">{player.name}</h1>
            <p className="text-sm text-muted">{player.position ?? "Player"}</p>
            {team && (
              <Link href={`/teams/${team.id}`} className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-sm font-bold transition active:scale-95">
                <TeamFlag team={team} size={18} /> {team.name}
              </Link>
            )}
          </div>
        </div>

        {/* Tournament line */}
        <Card className="flex flex-col gap-3">
          <CardTitle>This tournament</CardTitle>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="num-bc text-2xl font-black text-pitch">{goals}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">goals</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="num-bc text-2xl font-black">{scoring?.penalties ?? 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">penalties</div>
            </div>
          </div>
        </Card>

        {/* League interest */}
        {(goldenBooters.length > 0 || favouritedBy.length > 0 || backedOnMatch > 0) && (
          <Card className="flex flex-col gap-3">
            <CardTitle>In {league?.name ?? "your league"}</CardTitle>
            {goldenBooters.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">🥇 Golden Boot pick</p>
                <div className="flex flex-wrap gap-2">
                  {goldenBooters.map((m) => {
                    const c = chrome(m);
                    return (
                      <Link key={m.id} href={`/profile/${m.id}`} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-bold">
                        {c.flag} {m.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {favouritedBy.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">⭐ Favourite player</p>
                <div className="flex flex-wrap gap-2">
                  {favouritedBy.map((m) => {
                    const c = chrome(m);
                    return (
                      <Link key={m.id} href={`/profile/${m.id}`} className="rounded-full bg-surface-2 px-3 py-1.5 text-sm font-bold">
                        {c.flag} {m.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
            {backedOnMatch > 0 && (
              <p className="text-xs text-muted">
                Backed as a goalscorer on <span className="font-bold text-fg">{backedOnMatch}</span> match prediction{backedOnMatch > 1 ? "s" : ""}.
              </p>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

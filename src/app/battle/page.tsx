import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { ScoreBattle } from "@/components/score-battle";
import { Card, CardTitle } from "@/components/ui/card";
import { WinHistory } from "@/components/win-history";
import { chrome } from "@/lib/display";
import { melbourneDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { AppUser, PredictionScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BattlePage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const memberById = new Map<string, AppUser>(members.map((m) => [m.id, m]));
  const flagOf = (id: string) => {
    const m = memberById.get(id);
    return m ? chrome(m).flag : "⚽";
  };
  const nameOf = (id: string) => memberById.get(id)?.name ?? id;

  const model = await getReadModel(league ? { leagueId: league.id } : { restrictUserIds: [user.id] });

  const ordered = [...model.scoredMatches].sort(
    (a, b) => +new Date(a.match.kickoffAt) - +new Date(b.match.kickoffAt),
  );

  const allScores: { score: PredictionScore; matchId: string }[] = [];
  for (const sm of ordered) for (const s of sm.scores) allScores.push({ score: s, matchId: sm.match.id });
  const best = [...allScores].sort((a, b) => b.score.totalPoints - a.score.totalPoints)[0];
  const worst = [...allScores].sort((a, b) => a.score.totalPoints - b.score.totalPoints)[0];
  const last = ordered[ordered.length - 1];

  const teamLabel = (matchId: string) => {
    const m = model.matches.find((x) => x.id === matchId);
    if (!m) return "";
    return `${model.teamById.get(m.homeTeamId)?.shortName} v ${model.teamById.get(m.awayTeamId)?.shortName}`;
  };

  const history = ordered.map((sm) => ({
    label: teamLabel(sm.match.id),
    day: melbourneDay(sm.match.kickoffAt),
    winner: sm.winnerUserId,
    winnerFlag: sm.winnerUserId ? flagOf(sm.winnerUserId) : null,
    winnerName: sm.winnerUserId ? nameOf(sm.winnerUserId) : null,
  }));

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">The Clash ⚔️</h1>
      {league && <p className="mb-4 text-sm text-muted">{league.name} · {members.length} players</p>}

      <div className="flex flex-col gap-4">
        <ScoreBattle rows={model.leaderboard} />

        {last && (
          <Card>
            <CardTitle>Last match winner</CardTitle>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold">{teamLabel(last.match.id)}</span>
              <span className="font-black">
                {last.winnerUserId ? `${flagOf(last.winnerUserId)} ${nameOf(last.winnerUserId)} 🏆` : "Tie 🤝"}
              </span>
            </div>
          </Card>
        )}

        {best && (
          <Card className="ring-1 ring-pitch/40">
            <CardTitle>Best prediction</CardTitle>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold">
                {flagOf(best.score.userId)} {nameOf(best.score.userId)} · {teamLabel(best.matchId)}
              </span>
              <span className="text-xl font-black text-pitch">{best.score.totalPoints} pts</span>
            </div>
          </Card>
        )}
        {worst && worst !== best && (
          <Card className="ring-1 ring-danger/40">
            <CardTitle>Most delusional prediction</CardTitle>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-bold">
                {flagOf(worst.score.userId)} {nameOf(worst.score.userId)} · {teamLabel(worst.matchId)}
              </span>
              <span className="text-xl font-black text-danger">{worst.score.totalPoints} pts</span>
            </div>
          </Card>
        )}

        <Card>
          <CardTitle>Win / loss history</CardTitle>
          <div className="mt-3">
            <WinHistory history={history} />
          </div>
        </Card>

        <Card>
          <CardTitle>Prediction heat map</CardTitle>
          <div className={cn("mt-3 grid gap-3", members.length > 2 ? "grid-cols-1" : "grid-cols-2")}>
            {members.map((mem) => {
              const row = model.leaderboard.find((r) => r.user.id === mem.id);
              const c = chrome(mem);
              return (
                <div key={mem.id} className="rounded-xl bg-surface-2 p-3">
                  <p className="mb-2 text-sm font-bold">{c.flag} {c.name}</p>
                  <div className="grid grid-cols-8 gap-1">
                    {ordered.map((sm) => {
                      const w = sm.winnerUserId === mem.id;
                      const d = sm.winnerUserId === null;
                      return (
                        <div
                          key={sm.match.id}
                          title={teamLabel(sm.match.id)}
                          className={cn("aspect-square rounded", w ? "bg-pitch" : d ? "bg-gold/50" : "bg-danger/40")}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-muted">
                    {row?.matchWins ?? 0}W · {row?.matchDraws ?? 0}D · {row?.matchLosses ?? 0}L
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

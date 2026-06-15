import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getProvider } from "@/lib/football-api/provider";
import { getReadModel } from "@/lib/aggregate";
import { getPredictionsForMatch } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { TeamFlag } from "@/components/team-flag";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Confetti } from "@/components/confetti";
import { PredictionForm } from "@/components/prediction-form";
import { MatchTimeline } from "@/components/match-timeline";
import { PredictionSummary } from "@/components/prediction-summary";
import { ShareResult } from "@/components/share-result";
import { melbourne, isLocked } from "@/lib/time";
import { chrome } from "@/lib/display";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const provider = getProvider();

  const match = await provider.getMatch(id);
  if (!match) notFound();

  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const memberIds = new Set(members.map((m) => m.id));

  const [model, events, allPreds] = await Promise.all([
    getReadModel(league ? { leagueId: league.id } : { restrictUserIds: [user.id] }),
    provider.getMatchEvents(id),
    getPredictionsForMatch(id),
  ]);
  const preds = allPreds.filter((p) => memberIds.has(p.userId));

  const home = model.teamById.get(match.homeTeamId);
  const away = model.teamById.get(match.awayTeamId);
  if (!home || !away) notFound();

  const [homePlayers, awayPlayers] = await Promise.all([
    provider.getPlayers(home.id),
    provider.getPlayers(away.id),
  ]);

  const locked = isLocked(match.kickoffAt, new Date());
  const finished = match.status === "full_time";
  const live = match.status === "live";

  const myPred = preds.find((p) => p.userId === user.id) ?? null;
  const scores = model.scoresByMatch.get(id) ?? [];
  const sm = model.scoredMatches.find((s) => s.match.id === id);
  const iWon = finished && sm?.winnerUserId === user.id;
  const myScore = scores.find((s) => s.userId === user.id);
  // Celebrate a correct result (right outcome or exact score). Bigger for exact.
  const gotResult = Boolean(finished && myScore && (myScore.resultPoints > 0 || myScore.exactScorePoints > 0));
  const bigWin = Boolean(finished && myScore && (myScore.exactScorePoints > 0 || myScore.badges.includes("psychic_mode")));

  const playerById = {
    ...mapToObj(model.playerById),
    ...Object.fromEntries([...homePlayers, ...awayPlayers].map((p) => [p.id, p])),
  };
  const memberById = new Map<string, AppUser>(members.map((m) => [m.id, m]));
  const otherPredicted = preds.filter((p) => p.userId !== user.id).length;

  // Order: me first, then other members.
  const ordered = [user, ...members.filter((m) => m.id !== user.id)];

  return (
    <AppShell>
      {gotResult && <Confetti dedupeKey={`${id}-${user.id}`} big={bigWin} sound />}

      <div className="glass mb-4 p-5">
        <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-muted">
          <span>
            {match.stage.replace(/_/g, " ")}
            {match.groupName ? ` · Group ${match.groupName}` : ""}
          </span>
          {live && <Badge tone="live">● Live</Badge>}
          {finished && <Badge>Full-time</Badge>}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <TeamFlag team={home} size={52} />
            <span className="text-center text-sm font-bold">{home.name}</span>
          </div>
          <div className="text-center">
            {live || finished ? (
              <div className="text-4xl font-black tabular-nums">
                {match.homeScore}<span className="mx-1 text-muted">–</span>{match.awayScore}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg font-black">{melbourne(match.kickoffAt, "h:mm a")}</div>
                <div className="text-[10px] uppercase text-muted">{melbourne(match.kickoffAt, "EEE d MMM")}</div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <TeamFlag team={away} size={52} />
            <span className="text-center text-sm font-bold">{away.name}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          {match.venue} · {melbourne(match.kickoffAt)} (Melb)
        </p>
      </div>

      {finished && myScore && (
        <div className={`mb-4 glass card-bc p-4 ${gotResult ? "ring-1 ring-pitch/50" : ""}`}>
          {gotResult && (
            <p className="title-bc mb-2 text-pitch">
              🎉 You called it{bigWin ? " — exact score!" : ""} · {myScore.totalPoints} pts
            </p>
          )}
          <ShareResult
            matchId={id}
            name={user.name}
            pts={myScore.totalPoints}
            tag={bigWin ? "EXACT" : gotResult ? "CORRECT" : ""}
            label={
              gotResult
                ? `I scored ${myScore.totalPoints} pts on ${home.shortName} v ${away.shortName}`
                : `${home.shortName} v ${away.shortName}`
            }
          />
        </div>
      )}

      {(live || finished) && events.length > 0 && (
        <div className="mb-4">
          <CardTitle>Match events</CardTitle>
          <div className="mt-2">
            <MatchTimeline events={events} playerById={playerById} teamById={mapToObj(model.teamById)} homeId={home.id} />
          </div>
        </div>
      )}

      {!locked ? (
        <>
          <Card className="mb-4 flex items-center gap-3">
            <Lock size={18} className="text-[var(--accent)]" />
            <p className="text-xs text-muted">
              Locks at kickoff · {otherPredicted > 0
                ? `${otherPredicted} other player${otherPredicted > 1 ? "s" : ""} locked in (hidden 👀)`
                : "no one else has predicted yet"}
            </p>
          </Card>
          <PredictionForm
            match={match}
            home={home}
            away={away}
            homePlayers={homePlayers}
            awayPlayers={awayPlayers}
            userId={user.id}
            existing={myPred}
          />
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <CardTitle>Predictions {finished ? "& points" : "(locked)"}</CardTitle>
          {ordered.map((m) => {
            const pred = preds.find((p) => p.userId === m.id);
            const score = scores.find((s) => s.userId === m.id);
            const c = chrome(memberById.get(m.id) ?? m);
            if (!pred) {
              return (
                <Card key={m.id}>
                  <p className="text-sm font-bold">{c.flag} {c.name}</p>
                  <p className="text-xs text-muted">No prediction — slept on this one.</p>
                </Card>
              );
            }
            return (
              <PredictionSummary
                key={m.id}
                displayName={c.name}
                flag={c.flag}
                prediction={pred}
                score={score}
                home={home}
                away={away}
                playerById={playerById}
                winner={finished && sm?.winnerUserId === m.id}
              />
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function mapToObj<T>(m: Map<string, T>): Record<string, T> {
  return Object.fromEntries(m);
}

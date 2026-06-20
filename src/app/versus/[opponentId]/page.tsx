import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getUser } from "@/lib/data";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { HeadToHead, type H2HRow } from "@/components/head-to-head";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function VersusPage({
  params,
}: {
  params: Promise<{ opponentId: string }>;
}) {
  const { opponentId } = await params;
  const user = await requireUser();
  if (opponentId === user.id) notFound();
  const opponent = await getUser(opponentId);
  if (!opponent) notFound();

  // Just the two of us — works whether you're league mates or just friends.
  const model = await getReadModel({ restrictUserIds: [user.id, opponentId] });

  const finished = model.scoredMatches
    .filter((sm) => sm.match.status === "full_time")
    .sort((a, b) => +new Date(b.match.kickoffAt) - +new Date(a.match.kickoffAt));

  const fmt = (p?: { predictedHomeScore?: number | null; predictedAwayScore?: number | null }) =>
    p ? `${p.predictedHomeScore ?? "–"}–${p.predictedAwayScore ?? "–"}` : "—";

  const rows: H2HRow[] = [];
  let myWins = 0, oppWins = 0, draws = 0, myPoints = 0, oppPoints = 0;

  for (const sm of finished) {
    const myScore = sm.scores.find((s) => s.userId === user.id);
    const oppScore = sm.scores.find((s) => s.userId === opponentId);
    if (!myScore || !oppScore) continue; // a head-to-head needs both picks

    const winner: H2HRow["winner"] =
      myScore.totalPoints > oppScore.totalPoints
        ? "me"
        : oppScore.totalPoints > myScore.totalPoints
          ? "opp"
          : "draw";
    if (winner === "me") myWins++;
    else if (winner === "opp") oppWins++;
    else draws++;
    myPoints += myScore.totalPoints;
    oppPoints += oppScore.totalPoints;

    const home = model.teamById.get(sm.match.homeTeamId);
    const away = model.teamById.get(sm.match.awayTeamId);
    rows.push({
      matchId: sm.match.id,
      home: home?.shortName ?? home?.name ?? sm.match.homeTeamId,
      away: away?.shortName ?? away?.name ?? sm.match.awayTeamId,
      homeFlag: home?.flagUrl ?? "",
      awayFlag: away?.flagUrl ?? "",
      actual: `${sm.match.homeScore}-${sm.match.awayScore}`,
      myPred: fmt(model.predictions.find((p) => p.userId === user.id && p.matchId === sm.match.id)),
      myPts: myScore.totalPoints,
      oppPred: fmt(model.predictions.find((p) => p.userId === opponentId && p.matchId === sm.match.id)),
      oppPts: oppScore.totalPoints,
      winner,
    });
  }

  const oc = chrome(opponent);

  return (
    <AppShell>
      <h1 className="title-bc mb-4 text-3xl">You vs {oc.name}</h1>
      <HeadToHead
        me={{ name: user.name, flag: chrome(user).flag }}
        opp={{ name: oc.name, flag: oc.flag }}
        rows={rows}
        tally={{ myWins, oppWins, draws, myPoints, oppPoints }}
      />
    </AppShell>
  );
}

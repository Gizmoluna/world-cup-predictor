import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { ScoreBattle } from "@/components/score-battle";
import { MatchCard, type Predictor } from "@/components/match-card";
import { HeroMatch } from "@/components/hero-match";
import { FactTicker } from "@/components/fact-ticker";
import { Card, CardTitle } from "@/components/ui/card";
import { computeDerivedFacts } from "@/lib/facts";
import { isSameMelbourneDay } from "@/lib/time";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];
  const memberIds = members.map((m) => m.id);

  const model = await getReadModel({ restrictUserIds: memberIds });
  const provider = getProvider();
  const [news, bankFacts] = await Promise.all([provider.getNews(), provider.getFacts()]);
  const tickerFacts = [...computeDerivedFacts(model), ...bankFacts].slice(0, 40);

  const predictors = (matchId: string): Predictor[] =>
    members.map((m) => ({
      id: m.id,
      flag: chrome(m).flag,
      name: m.name,
      did: model.predictions.some((p) => p.userId === m.id && p.matchId === matchId),
    }));

  const nowIso = new Date().toISOString();
  const todays = model.matches
    .filter((m) => isSameMelbourneDay(m.kickoffAt, nowIso))
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt));

  const myOpenPredictions = model.matches.filter(
    (m) =>
      m.status === "upcoming" &&
      !model.predictions.some((p) => p.userId === user.id && p.matchId === m.id),
  );

  const me = model.leaderboard.find((r) => r.user.id === user.id);

  // Featured match for the hero banner: live first, else the soonest upcoming.
  const sorted = [...model.matches].sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt));
  const featured =
    sorted.find((m) => m.status === "live") ??
    sorted.find((m) => m.status === "upcoming") ??
    sorted[sorted.length - 1];

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="title-bc text-3xl">
            Hey {user.name} {chrome(user).flag}
          </h1>
          <p className="text-sm text-muted">
            {league ? `${league.name} · ` : ""}
            {myOpenPredictions.length > 0
              ? `${myOpenPredictions.length} match${myOpenPredictions.length > 1 ? "es" : ""} need your prediction`
              : "You're all locked in. Good luck."}
          </p>
        </div>

        {featured && (
          <HeroMatch
            match={featured}
            home={model.teamById.get(featured.homeTeamId)}
            away={model.teamById.get(featured.awayTeamId)}
            predicted={model.predictions.some((p) => p.userId === user.id && p.matchId === featured.id)}
          />
        )}

        {!league && (
          <Link href="/leagues" className="glass block p-4 ring-1 ring-[var(--accent)]/50 transition active:scale-[0.99]">
            <p className="text-sm font-bold">You&apos;re not in a league yet 🏆</p>
            <p className="mt-1 text-xs text-muted">
              Create a league and share the code, or join your friends with their code. <span className="text-[var(--accent)]">Go to Leagues →</span>
            </p>
          </Link>
        )}

        <ScoreBattle rows={model.leaderboard} />

        <FactTicker facts={tickerFacts} />

        {me && (me.currentStreak >= 2 || me.currentStreak <= -2) && (
          <Card className="flex items-center gap-3">
            <Flame className="text-gold animate-flame" />
            <p className="text-sm font-semibold">
              {me.currentStreak >= 2
                ? `🔥 ${me.currentStreak}-match winning streak!`
                : `😬 ${Math.abs(me.currentStreak)}-match cold streak. Time to bounce back.`}
            </p>
          </Card>
        )}

        {myOpenPredictions.length > 0 && (
          <section className="flex flex-col gap-2">
            <CardTitle>Needs your prediction</CardTitle>
            {myOpenPredictions.slice(0, 3).map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                home={model.teamById.get(m.homeTeamId)}
                away={model.teamById.get(m.awayTeamId)}
                predictors={predictors(m.id)}
                needsPrediction
              />
            ))}
          </section>
        )}

        <section className="flex flex-col gap-2">
          <CardTitle>Today&apos;s matches</CardTitle>
          {todays.length === 0 ? (
            <Card className="text-sm text-muted">No matches today (Melbourne time).</Card>
          ) : (
            todays.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                home={model.teamById.get(m.homeTeamId)}
                away={model.teamById.get(m.awayTeamId)}
                predictors={predictors(m.id)}
              />
            ))
          )}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle>News</CardTitle>
            <Link href="/news" className="flex items-center text-xs font-bold text-[var(--accent)]">
              All <ChevronRight size={14} />
            </Link>
          </div>
          {news.slice(0, 3).map((n) => (
            <Card key={n.id} className="p-3">
              <p className="text-sm font-bold leading-snug">{n.title}</p>
              <p className="mt-1 text-xs text-muted">{n.summary}</p>
            </Card>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

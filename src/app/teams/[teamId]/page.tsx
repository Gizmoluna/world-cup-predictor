import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { TeamFlag } from "@/components/team-flag";
import { topScorers, teamForm } from "@/lib/insights";
import { melbourne } from "@/lib/time";
import { chrome } from "@/lib/display";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const user = await requireUser();
  const provider = getProvider();
  const model = await getReadModel();
  const team = model.teamById.get(teamId);
  if (!team) notFound();

  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];

  // This team's matches (results + fixtures), newest first.
  const matches = model.matches
    .filter((m) => m.homeTeamId === teamId || m.awayTeamId === teamId)
    .sort((a, b) => +new Date(b.kickoffAt) - +new Date(a.kickoffAt));
  const form = teamForm(teamId, model.matches);

  // This team's goals — events across its finished matches.
  const finishedIds = matches.filter((m) => m.status === "full_time").map((m) => m.id);
  const events = (await Promise.all(finishedIds.map((id) => provider.getMatchEvents(id)))).flat();
  const scorers = topScorers(events, model.playerById, model.teamById).filter((s) => s.teamId === teamId);

  // Who in your league is backing this team (favourite team or country pick).
  const backers = members.filter(
    (m) =>
      m.favouriteTeamId === teamId ||
      [m.homeCountry, m.adoptedCountry, m.favouriteCountry, m.nationality]
        .filter(Boolean)
        .some((c) => (c as string).toLowerCase() === team.name.toLowerCase()),
  );

  const formChip = (r: "W" | "D" | "L") => (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md text-xs font-black",
        r === "W" ? "bg-pitch/25 text-pitch" : r === "L" ? "bg-danger/25 text-danger" : "bg-white/10 text-muted",
      )}
    >
      {r}
    </span>
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <TeamFlag team={team} size={56} />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black">{team.name}</h1>
            <p className="text-sm text-muted">
              {team.groupName ? `Group ${team.groupName}` : ""}
              {team.confederation ? ` · ${team.confederation}` : ""}
            </p>
          </div>
        </div>

        {/* Record + form */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Tournament record</CardTitle>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="num-bc text-xl font-black">{form.wins}–{form.draws}–{form.losses}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">W–D–L</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="num-bc text-xl font-black text-pitch">{form.goalsFor}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">scored</div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="num-bc text-xl font-black text-danger">{form.goalsAgainst}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted">conceded</div>
            </div>
          </div>
          {form.form.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Form</span>
              {form.form.slice(0, 6).map((r, i) => <span key={i}>{formChip(r)}</span>)}
            </div>
          )}
        </Card>

        {/* Backers in your league */}
        {backers.length > 0 && (
          <Card className="flex flex-col gap-2">
            <CardTitle>Backing them in {league?.name ?? "your league"}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {backers.map((b) => {
                const c = chrome(b);
                return (
                  <Link key={b.id} href={`/profile/${b.id}`} className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-bold">
                    {c.flag} {b.name}
                  </Link>
                );
              })}
            </div>
          </Card>
        )}

        {/* Team scorers */}
        {scorers.length > 0 && (
          <Card className="flex flex-col gap-2">
            <CardTitle>Goals</CardTitle>
            <div className="flex flex-col gap-1.5">
              {scorers.map((s) => (
                <div key={s.playerId} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="font-bold">{s.name}</span>
                  <span className="num-bc font-black text-pitch">{s.goals}{s.penalties > 0 ? ` (${s.penalties}p)` : ""}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Fixtures & results */}
        <Card className="flex flex-col gap-2">
          <CardTitle>Matches</CardTitle>
          <div className="flex flex-col gap-1.5">
            {matches.map((m) => {
              const opp = model.teamById.get(m.homeTeamId === teamId ? m.awayTeamId : m.homeTeamId);
              const done = m.status === "full_time";
              const home = m.homeTeamId === teamId;
              return (
                <Link key={m.id} href={`/matches/${m.id}`} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm transition active:scale-[0.99]">
                  <span className="flex min-w-0 items-center gap-2">
                    {opp && <TeamFlag team={opp} size={20} />}
                    <span className="truncate font-semibold">{home ? "vs" : "@"} {opp?.shortName ?? opp?.name ?? "—"}</span>
                  </span>
                  {done ? (
                    <span className="num-bc shrink-0 font-black">{m.homeScore}–{m.awayScore}</span>
                  ) : (
                    <span className="shrink-0 text-[11px] text-muted">{melbourne(m.kickoffAt, "EEE d MMM")}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { LeadersCharts } from "@/components/leaders-charts";
import type { LeaderboardRow } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { TeamFlag } from "@/components/team-flag";
import { rival, THEMES } from "@/lib/constants";
import type { PredictionScore, Team } from "@/lib/types";
import { cn, pct } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Which PredictionScore numeric fields we surface in "Points by category".
const CATEGORY_FIELDS: { key: keyof PredictionScore; label: string }[] = [
  { key: "exactScorePoints", label: "Exact score" },
  { key: "resultPoints", label: "Result" },
  { key: "goalDifferencePoints", label: "Goal difference" },
  { key: "totalGoalsPoints", label: "Total goals" },
  { key: "firstTeamScorePoints", label: "First to score" },
  { key: "bttsPoints", label: "Both teams score" },
  { key: "cleanSheetPoints", label: "Clean sheet" },
  { key: "firstGoalScorerPoints", label: "First scorer" },
  { key: "anytimeGoalScorerPoints", label: "Anytime scorer" },
  { key: "playerOfMatchPoints", label: "Player of match" },
  { key: "cardPoints", label: "Cards" },
  { key: "penaltyPoints", label: "Penalty" },
  { key: "shootoutPoints", label: "Shootout" },
  { key: "bonusPoints", label: "Bonus" },
];

const RIVAL_IDS = ["carina", "johnny"] as const;
type RivalId = (typeof RIVAL_IDS)[number];

export default async function StatsPage() {
  await requireUser();
  const model = await getReadModel();
  const leaders = await getProvider().getLeaders();

  const rowOf = (id: string): LeaderboardRow | undefined =>
    model.leaderboard.find((r) => r.user.id === id);
  const carina = rowOf("carina");
  const johnny = rowOf("johnny");

  // ---- (b) Points by category ----------------------------------------------
  const catTotals: Record<RivalId, Record<string, number>> = {
    carina: {},
    johnny: {},
  };
  for (const scores of model.scoresByMatch.values()) {
    for (const s of scores) {
      if (s.userId !== "carina" && s.userId !== "johnny") continue;
      const bucket = catTotals[s.userId as RivalId];
      for (const { key } of CATEGORY_FIELDS) {
        const v = s[key];
        if (typeof v === "number") bucket[key] = (bucket[key] ?? 0) + v;
      }
    }
  }
  const catRows = CATEGORY_FIELDS.map((f) => ({
    label: f.label,
    carina: catTotals.carina[f.key as string] ?? 0,
    johnny: catTotals.johnny[f.key as string] ?? 0,
  })).filter((r) => r.carina > 0 || r.johnny > 0);

  // ---- (c) Team bias meter --------------------------------------------------
  const teamBias = (userId: string) => {
    const counts = new Map<string, number>();
    for (const p of model.predictions) {
      if (p.userId !== userId || !p.predictedWinnerTeamId) continue;
      counts.set(p.predictedWinnerTeamId, (counts.get(p.predictedWinnerTeamId) ?? 0) + 1);
    }
    let top: { team?: Team; count: number } = { count: 0 };
    let total = 0;
    for (const [teamId, count] of counts) {
      total += count;
      if (count > top.count) top = { team: model.teamById.get(teamId), count };
    }
    return { top, total };
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black">Deep Stats</h1>
          <p className="text-sm text-muted">The clash, broken down to the bone.</p>
        </div>

        {/* Tournament leaders — live top scorers & assists */}
        <section className="flex flex-col gap-2">
          <CardTitle>Tournament leaders</CardTitle>
          <LeadersCharts scorers={leaders.scorers} assists={leaders.assists} />
        </section>

        {/* (a) Head-to-head summary */}
        <section className="flex flex-col gap-2">
          <CardTitle>Head to head</CardTitle>
          <Card className="grid grid-cols-2 gap-px overflow-hidden bg-border p-0">
            <RivalColumn id="carina" row={carina} align="left" />
            <RivalColumn id="johnny" row={johnny} align="right" />
          </Card>
        </section>

        {/* (b) Points by category */}
        <section className="flex flex-col gap-2">
          <CardTitle>Points by category</CardTitle>
          <Card className="flex flex-col gap-3">
            <Legend />
            {catRows.length === 0 ? (
              <p className="text-sm text-muted">No scored matches yet.</p>
            ) : (
              catRows.map((r) => (
                <CompareBar key={r.label} label={r.label} left={r.carina} right={r.johnny} />
              ))
            )}
          </Card>
        </section>

        {/* (c) Team bias meter */}
        <section className="flex flex-col gap-2">
          <CardTitle>Team bias meter</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            {RIVAL_IDS.map((id) => {
              const { top, total } = teamBias(id);
              const r = rival(id);
              return (
                <Card key={id} className="flex flex-col items-center gap-2 text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">
                    {r?.flag} {r?.name}
                  </span>
                  {top.team ? (
                    <>
                      <TeamFlag team={top.team} size={44} />
                      <span className="text-sm font-bold leading-tight">{top.team.name}</span>
                      <span className="text-xs text-muted">
                        backed {top.count}/{total} ({pct(top.count, total)}%)
                      </span>
                    </>
                  ) : (
                    <span className="py-4 text-sm text-muted">No picks yet</span>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* (d) Prediction accuracy */}
        <section className="flex flex-col gap-2">
          <CardTitle>Prediction accuracy</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            {RIVAL_IDS.map((id) => {
              const row = rowOf(id);
              const r = rival(id);
              const played = row?.played ?? 0;
              return (
                <Card key={id} className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">
                    {r?.flag} {r?.name}
                  </span>
                  <AccuracyStat
                    label="Perfect picks"
                    num={row?.perfectPicks ?? 0}
                    den={played}
                  />
                  <AccuracyStat
                    label="Exact scores"
                    num={row?.exactScores ?? 0}
                    den={played}
                  />
                  <AccuracyStat
                    label="Confidence hit"
                    num={row?.avgConfidenceAccuracy ?? 0}
                    den={100}
                    rawPct={row?.avgConfidenceAccuracy ?? 0}
                  />
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function RivalColumn({
  id,
  row,
  align,
}: {
  id: RivalId;
  row?: LeaderboardRow;
  align: "left" | "right";
}) {
  const r = rival(id);
  const theme = THEMES[id];
  const streak = row?.currentStreak ?? 0;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 bg-surface p-4",
        align === "right" ? "items-end text-right" : "items-start text-left",
      )}
    >
      <div className="h-1 w-12 rounded-full" style={{ background: theme?.gradient }} />
      <div className="flex items-center gap-1.5 text-base font-extrabold">
        <span>{r?.flag}</span>
        <span>{r?.name}</span>
      </div>
      <div className="text-3xl font-black tabular-nums">{row?.points ?? 0}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted">points</div>

      <dl className="flex w-full flex-col gap-1.5 text-sm">
        <StatLine align={align} label="Record (W-D-L)">
          {row?.matchWins ?? 0}-{row?.matchDraws ?? 0}-{row?.matchLosses ?? 0}
        </StatLine>
        <StatLine align={align} label="Exact scores">{row?.exactScores ?? 0}</StatLine>
        <StatLine align={align} label="Perfect picks">{row?.perfectPicks ?? 0}</StatLine>
        <StatLine align={align} label="Streak">
          {streak === 0 ? "—" : streak > 0 ? `🔥 ${streak}` : `❄️ ${Math.abs(streak)}`}
        </StatLine>
        <StatLine align={align} label="Confidence">{row?.avgConfidenceAccuracy ?? 0}%</StatLine>
      </dl>
    </div>
  );
}

function StatLine({
  label,
  children,
  align,
}: {
  label: string;
  children: React.ReactNode;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-2",
        align === "right" && "flex-row-reverse",
      )}
    >
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-bold tabular-nums">{children}</dd>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wide text-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: THEMES.carina.accent }} />
        Carina
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: THEMES.johnny.accent }} />
        Johnny
      </span>
    </div>
  );
}

function CompareBar({ label, left, right }: { label: string; left: number; right: number }) {
  const max = Math.max(left, right, 1);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold tabular-nums" style={{ color: THEMES.carina.accent }}>{left}</span>
        <span className="text-muted">{label}</span>
        <span className="font-bold tabular-nums" style={{ color: THEMES.johnny.accent }}>{right}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex h-2 flex-1 justify-end overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${(left / max) * 100}%`, background: THEMES.carina.accent }}
          />
        </div>
        <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${(right / max) * 100}%`, background: THEMES.johnny.accent }}
          />
        </div>
      </div>
    </div>
  );
}

function AccuracyStat({
  label,
  num,
  den,
  rawPct,
}: {
  label: string;
  num: number;
  den: number;
  rawPct?: number;
}) {
  const percent = rawPct ?? pct(num, den);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-bold tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-[var(--accent)]"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {rawPct === undefined && (
        <span className="text-[10px] text-muted tabular-nums">
          {num} of {den}
        </span>
      )}
    </div>
  );
}

import type { Player, Prediction, PredictionScore, Team } from "@/lib/types";
import { getBadge } from "@/lib/scoring/badges";
import { cn } from "@/lib/utils";

export function PredictionSummary({
  displayName,
  flag,
  prediction,
  score,
  home,
  away,
  playerById,
  winner,
}: {
  displayName: string;
  flag: string;
  prediction: Prediction;
  score?: PredictionScore;
  home: Team;
  away: Team;
  playerById: Record<string, Player>;
  winner?: boolean;
}) {
  const name = (id?: string | null) => (id ? playerById[id]?.name ?? "—" : "—");
  const teamName = (id?: string | null) =>
    id === home.id ? home.shortName : id === away.id ? away.shortName : id === "none" ? "None" : "—";

  // What each point actually came from — so you can see *why* someone scored,
  // e.g. "🥅 First scorer: Messi +4". Only non-zero categories are listed.
  const breakdown: { icon: string; label: string; pts: number }[] = [];
  if (score) {
    const add = (pts: number, icon: string, label: string) => {
      if (pts > 0) breakdown.push({ icon, label, pts });
    };
    add(score.exactScorePoints, "🎯", `Exact score ${prediction.predictedHomeScore ?? "–"}–${prediction.predictedAwayScore ?? "–"}`);
    add(score.resultPoints, "✅", "Correct result");
    add(score.goalDifferencePoints, "➗", "Goal difference");
    add(score.totalGoalsPoints, "🔢", "Total goals");
    add(score.firstTeamScorePoints, "⚡", `First to score: ${teamName(prediction.firstTeamToScoreId)}`);
    add(score.bttsPoints, "🤝", `Both teams to score: ${prediction.bothTeamsToScore ? "Yes" : "No"}`);
    add(score.cleanSheetPoints, "🧤", "Clean sheet");
    add(score.firstGoalScorerPoints, "🥅", `First scorer: ${name(prediction.firstGoalScorerId)}`);
    add(score.anytimeGoalScorerPoints, "⚽", `Anytime scorer: ${name(prediction.anytimeGoalScorerId)}`);
    add(score.playerOfMatchPoints, "⭐", `Player of the match: ${name(prediction.playerOfMatchId)}`);
    add(score.cardPoints, "🟨", "Cards");
    add(score.penaltyPoints, "🎲", "Penalty called");
    add(score.shootoutPoints, "🥅", "Shootout winner");
    add(score.bonusPoints, "✨", "Bonus");
  }
  const boosted = score ? (score.multiplier ?? 1) > 1 : false;

  const lines: [string, string][] = [
    ["Score", `${prediction.predictedHomeScore ?? "–"}–${prediction.predictedAwayScore ?? "–"}`],
    ["First to score", teamName(prediction.firstTeamToScoreId)],
    ["BTTS", prediction.bothTeamsToScore == null ? "—" : prediction.bothTeamsToScore ? "Yes" : "No"],
    ["First scorer", name(prediction.firstGoalScorerId)],
    ["Anytime scorer", name(prediction.anytimeGoalScorerId)],
    ["Player of match", name(prediction.playerOfMatchId)],
  ];
  if (prediction.upsetAlert) lines.push(["Upset alert", "💣 ON"]);

  return (
    <div className={cn("glass p-4", winner && "ring-1 ring-pitch/50")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <span>{flag}</span>
          <span>{displayName}</span>
          {winner && <span className="text-pitch">🏆 won this match</span>}
          {(prediction.confidenceMultiplier ?? 1) > 1 && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-black text-gold">
              {prediction.confidenceMultiplier}× boost
            </span>
          )}
        </div>
        {score && (
          <div className="text-right">
            <div className="text-2xl font-black tabular-nums text-[var(--accent)]">{score.totalPoints}</div>
            <div className="text-[10px] uppercase text-muted">points</div>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {lines.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 border-b border-border/50 py-1">
            <dt className="text-muted">{k}</dt>
            <dd className="truncate font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {(prediction.wagerAmount ?? 0) > 0 && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-xs">
          <span className="text-muted">💵 Wagered ${prediction.wagerAmount}</span>
          {score && (
            <span className={cn("font-bold", score.wagerProfit >= 0 ? "text-pitch" : "text-danger")}>
              {score.wagerProfit >= 0 ? "+" : "−"}${Math.abs(score.wagerProfit)}
            </span>
          )}
        </div>
      )}

      {score && (
        <div className="mt-3 rounded-xl bg-surface-2 p-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">
            How they scored
          </p>
          {breakdown.length === 0 ? (
            <p className="text-xs text-muted">No points from this match — better luck next time.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {breakdown.map((b) => (
                <li key={b.label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span>{b.icon}</span>
                    <span className="truncate font-medium">{b.label}</span>
                  </span>
                  <span className="num-bc shrink-0 rounded-md bg-pitch/20 px-1.5 py-0.5 text-pitch">
                    +{b.pts}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {boosted && breakdown.length > 0 && (
            <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
              <span className="font-semibold text-gold">
                {score!.subtotal} × {score!.multiplier} confidence boost
              </span>
              <span className="num-bc font-black text-[var(--accent)]">= {score!.totalPoints}</span>
            </div>
          )}
        </div>
      )}

      {score && score.badges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {score.badges.map((b) => {
            const badge = getBadge(b);
            if (!badge) return null;
            return (
              <span
                key={b}
                className="rounded-full bg-white/8 px-2 py-1 text-[10px] font-bold"
                title={badge.description}
              >
                {badge.icon} {badge.name}
              </span>
            );
          })}
        </div>
      )}

      {(prediction.heartPick || prediction.headPick) && (
        <div className="mt-3 space-y-1 text-[11px] text-muted">
          {prediction.heartPick && <p>❤️ {prediction.heartPick}</p>}
          {prediction.headPick && <p>🧠 {prediction.headPick}</p>}
        </div>
      )}
    </div>
  );
}

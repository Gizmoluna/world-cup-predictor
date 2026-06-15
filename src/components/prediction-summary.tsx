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

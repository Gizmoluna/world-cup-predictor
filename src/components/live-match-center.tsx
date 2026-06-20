import { CountUp } from "./count-up";
import { cn } from "@/lib/utils";

export interface LiveRow {
  userId: string;
  name: string;
  flag: string;
  points: number;
  hits: string[];
  you: boolean;
}

// The Live Match Center board: while a match is in play, who's winning it on
// points right now, with each player's running total and the calls they've
// already banked. Re-rendered by the page's LiveRefresher every ~45s, so the
// numbers tick up as goals go in.
export function LiveMatchCenter({
  rows,
  homeName,
  awayName,
  homeScore,
  awayScore,
  live,
}: {
  rows: LiveRow[];
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  live: boolean;
}) {
  if (rows.length === 0) return null;
  const leader = rows[0];
  const leaderClear = rows.length > 1 && rows[0].points > rows[1].points;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-danger/40 bg-gradient-to-br from-danger/15 via-surface to-[var(--accent)]/10 shadow-lg">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="title-bc text-sm text-danger">
          {live ? "● LIVE" : "Full-time"} · Match center
        </span>
        <span className="num-bc text-sm tabular-nums">
          {homeName} {homeScore}–{awayScore} {awayName}
        </span>
      </div>

      {live && leaderClear && (
        <p className="px-4 pt-1 text-xs font-bold text-pitch">
          🔥 {leader.flag} {leader.name} is winning this match — {leader.points} pts
        </p>
      )}

      <ol className="mt-2 flex flex-col">
        {rows.map((r, i) => (
          <li
            key={r.userId}
            className={cn(
              "flex items-center gap-3 border-t border-border/40 px-4 py-2.5",
              r.you && "bg-[var(--accent-soft)]",
              i === 0 && r.points > 0 && "bg-pitch/10",
            )}
          >
            <span className={cn("num-bc w-5 text-center text-base", i === 0 ? "text-pitch" : "text-muted")}>
              {i + 1}
            </span>
            <span className="text-xl">{r.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {r.name}
                {r.you && " (you)"}
                {i === 0 && r.points > 0 && " 👑"}
              </p>
              {r.hits.length > 0 ? (
                <p className="truncate text-[11px] text-pitch">{r.hits.join(" · ")}</p>
              ) : (
                <p className="text-[11px] text-muted">no points banked yet</p>
              )}
            </div>
            <div className="text-right">
              <CountUp value={r.points} className="num-bc block text-2xl leading-none text-[var(--accent)]" />
              <span className="text-[9px] uppercase tracking-wide text-muted">pts {live ? "live" : ""}</span>
            </div>
          </li>
        ))}
      </ol>

      {live && (
        <p className="border-t border-border/40 px-4 py-2 text-center text-[10px] text-muted">
          Provisional — updates as the match plays out. Final points lock at full-time.
        </p>
      )}
    </div>
  );
}

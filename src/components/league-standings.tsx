import Link from "next/link";
import { rankFor } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface StandingRow {
  userId: string;
  name: string;
  flag: string;
  points: number;
  played: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  exactScores: number;
}

// A compact football-style standings table for a single league: the positions
// plus the underlying data (played / W-D-L / exact) that determines the order.
export function LeagueStandings({
  leagueName,
  rows,
  currentUserId,
}: {
  leagueName: string;
  rows: StandingRow[];
  currentUserId?: string;
}) {
  const ranked = [...rows].sort((a, b) => b.points - a.points || b.exactScores - a.exactScores);
  const anyScored = ranked.some((r) => r.played > 0);

  return (
    <div className="glass card-bc overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <h2 className="title-bc text-sm text-[var(--accent)]">{leagueName} · Table</h2>
        <Link href="/leaderboard" className="text-[11px] font-bold text-[var(--accent)]">
          Full table →
        </Link>
      </div>

      {/* column headers */}
      <div className="mt-2 grid grid-cols-[24px_1fr_auto] items-center gap-2 border-b border-border px-4 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
        <span>#</span>
        <span>Player</span>
        <span className="flex items-center gap-3">
          <span className="w-8 text-center">Pld</span>
          <span className="w-14 text-center">W-D-L</span>
          <span className="w-8 text-center">Exact</span>
          <span className="w-9 text-right">Pts</span>
        </span>
      </div>

      <ol className="divide-y divide-border">
        {ranked.map((r, i) => {
          const rank = rankFor(r.points);
          const you = r.userId === currentUserId;
          return (
            <li key={r.userId}>
              <Link
                href={`/profile/${r.userId}`}
                className={cn(
                  "grid grid-cols-[24px_1fr_auto] items-center gap-2 px-4 py-2.5 transition active:bg-white/5",
                  you && "bg-[var(--accent-soft)]",
                )}
              >
                <span className={cn("num-bc text-center text-base", i === 0 ? "text-[var(--accent)]" : "text-muted")}>
                  {i + 1}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-lg">{r.flag}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {r.name}
                      {you && " (you)"}
                      {i === 0 && r.points > 0 && " 👑"}
                    </span>
                    <span className="block text-[10px] text-muted">
                      {rank.icon} {rank.title}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="w-8 text-center text-muted">{r.played}</span>
                  <span className="w-14 text-center font-semibold">
                    {r.matchWins}-{r.matchDraws}-{r.matchLosses}
                  </span>
                  <span className="w-8 text-center text-pitch">{r.exactScores}</span>
                  <span className="num-bc w-9 text-right text-base text-[var(--accent)]">{r.points}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {!anyScored && (
        <p className="border-t border-border px-4 py-2.5 text-center text-[11px] text-muted">
          No matches scored yet — positions fill in as results come in. Points come from match
          predictions, group/knockout futures, duels and the loyalty pot.
        </p>
      )}
    </div>
  );
}

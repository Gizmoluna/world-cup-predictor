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

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);

  return (
    <div className="glass card-bc overflow-hidden ring-1 ring-[var(--accent)]/40 accent-glow">
      {/* Prominent header bar */}
      <div className="flex items-center justify-between bg-[var(--accent-soft)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <div>
            <h2 className="title-bc text-lg leading-none">{leagueName}</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">League table</span>
          </div>
        </div>
        <Link href="/leaderboard" className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-[11px] font-bold text-black">
          Full table →
        </Link>
      </div>

      {/* column headers */}
      <div className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-border px-4 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted">
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
          const lead = i === 0 && r.points > 0;
          return (
            <li key={r.userId}>
              <Link
                href={`/profile/${r.userId}`}
                className={cn(
                  "grid grid-cols-[28px_1fr_auto] items-center gap-2 px-4 py-3 transition active:bg-white/5",
                  lead && "bg-gold/10",
                  you && "bg-[var(--accent-soft)]",
                )}
              >
                <span className={cn("text-center", medal(i) ? "text-lg" : "num-bc text-base text-muted")}>
                  {medal(i) ?? i + 1}
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
                  <span className="num-bc w-9 text-right text-xl font-black text-[var(--accent)]">{r.points}</span>
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

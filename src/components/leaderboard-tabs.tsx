"use client";

import { useState } from "react";
import { rankFor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";

interface Row {
  userId: string;
  name: string;
  flag: string;
  theme: string;
  points: number;
  played: number;
  matchWins: number;
  matchDraws: number;
  matchLosses: number;
  exactScores: number;
  perfectPicks: number;
  currentStreak: number;
  avgConfidenceAccuracy: number;
  winnings: number;
}

type Scope = "overall" | "group" | "knockout" | "daily";

const TABS: { key: Scope; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "group", label: "Group" },
  { key: "knockout", label: "Knockout" },
  { key: "daily", label: "Today" },
];

export function LeaderboardTabs({ scopes }: { scopes: Record<Scope, Row[]> }) {
  const [scope, setScope] = useState<Scope>("overall");
  const rows = scopes[scope];

  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95",
              scope === t.key ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {rows.every((r) => r.played === 0) ? (
        <p className="py-8 text-center text-sm text-muted">No scored matches in this view yet.</p>
      ) : (
        <Podium rows={rows} />
      )}

      <ol className="flex flex-col gap-2">
        {rows.map((r, i) => {
          const rank = rankFor(r.points);
          const lead = i === 0 && r.points > 0;
          return (
            <li
              key={r.userId}
              className={cn(
                "glass card-bc flex items-center gap-3 p-3.5 animate-rise",
                lead && "ring-1 ring-gold/50 accent-glow",
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={cn("num-bc w-7 text-center text-xl", lead ? "text-[var(--accent)]" : "text-muted")}>
                {i + 1}
              </span>
              <span className="text-2xl">{r.flag}</span>
              <div className="min-w-0 flex-1">
                <p className="title-bc truncate text-base">
                  {r.name}
                  {lead && " 👑"}
                  {r.currentStreak >= 2 && " 🔥"}
                </p>
                <p className="text-[11px] text-muted">
                  {rank.icon} {rank.title} · {r.matchWins}W·{r.matchDraws}D·{r.matchLosses}L · {r.exactScores} exact
                </p>
                <p className={cn("text-[11px] font-bold", r.winnings >= 0 ? "text-pitch" : "text-danger")}>
                  {r.winnings >= 0 ? "+" : "−"}${Math.abs(r.winnings)} bankroll
                </p>
              </div>
              <div className="text-right">
                <CountUp value={r.points} className="num-bc block text-3xl leading-none text-[var(--accent)]" />
                <div className="text-[10px] uppercase tracking-wide text-muted">pts · {r.played} pld</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Podium({ rows }: { rows: Row[] }) {
  const top = rows.slice(0, 3);
  // Display order: 2nd, 1st, 3rd (centre tallest), only those that exist.
  const order = [top[1], top[0], top[2]].filter(Boolean) as Row[];
  const heights: Record<string, string> = {};
  if (top[0]) heights[top[0].userId] = "h-24";
  if (top[1]) heights[top[1].userId] = "h-16";
  if (top[2]) heights[top[2].userId] = "h-12";
  const medal = (id: string) =>
    id === top[0]?.userId ? "🥇" : id === top[1]?.userId ? "🥈" : "🥉";

  return (
    <div className="glass card-bc mb-4 flex items-end justify-center gap-3 px-3 pb-3 pt-6">
      {order.map((r) => (
        <div key={r.userId} className="flex flex-1 flex-col items-center">
          <span className="text-2xl">{r.flag}</span>
          <span className="title-bc max-w-full truncate text-sm">{r.name}</span>
          <span className="num-bc text-lg text-[var(--accent)]">{r.points}</span>
          <div
            className={cn(
              "mt-1 flex w-full items-start justify-center rounded-t-lg bg-gradient-to-b from-[var(--accent)]/30 to-transparent pt-1.5 text-xl",
              heights[r.userId] ?? "h-12",
            )}
          >
            {medal(r.userId)}
          </div>
        </div>
      ))}
    </div>
  );
}

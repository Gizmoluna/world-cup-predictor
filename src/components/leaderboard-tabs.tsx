"use client";

import { useState } from "react";
import { rankFor } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

      {rows.every((r) => r.played === 0) && (
        <p className="py-8 text-center text-sm text-muted">No scored matches in this view yet.</p>
      )}

      <ol className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <li
            key={r.userId}
            className={cn(
              "glass flex items-center gap-3 p-4",
              i === 0 && r.points > 0 && "ring-1 ring-gold/50 accent-glow",
            )}
          >
            <span className="w-6 text-center text-lg font-black text-muted">{i + 1}</span>
            <span className="text-2xl">{r.flag}</span>
            <div className="flex-1">
              <p className="font-extrabold">
                {r.name}
                {i === 0 && r.points > 0 && " 👑"}
                {r.currentStreak >= 2 && " 🔥"}
              </p>
              <p className="text-[11px] text-muted">
                {rankFor(r.points).icon} {rankFor(r.points).title} · {r.matchWins}W·{r.matchDraws}D·{r.matchLosses}L · {r.exactScores} exact
              </p>
              <p className={cn("text-[11px] font-bold", r.winnings >= 0 ? "text-pitch" : "text-danger")}>
                {r.winnings >= 0 ? "+" : "−"}${Math.abs(r.winnings)} wagered
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tabular-nums text-[var(--accent)]">{r.points}</div>
              <div className="text-[10px] uppercase text-muted">{r.played} played</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

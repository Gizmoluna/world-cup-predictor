"use client";

import { useState } from "react";
import type { Match, Team } from "@/lib/types";
import { MatchCard, type Predictor } from "./match-card";
import { melbourneDay } from "@/lib/time";
import { cn } from "@/lib/utils";

interface Item {
  match: Match;
  home?: Team;
  away?: Team;
  predictors: Predictor[];
}

type StatusFilter = "all" | "upcoming" | "live" | "full_time" | "knockout";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "full_time", label: "Results" },
  { key: "knockout", label: "Knockout" },
];

export function MatchFilter({
  items,
  groups,
  favouriteTeamId,
}: {
  items: Item[];
  groups: string[];
  favouriteTeamId?: string | null;
}) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [group, setGroup] = useState<string | "all">("all");
  const [mineOnly, setMineOnly] = useState(false);

  const filtered = items.filter((it) => {
    if (status === "knockout") {
      if (it.match.stage === "group") return false;
    } else if (status !== "all" && it.match.status !== status) {
      return false;
    }
    if (group !== "all" && it.match.groupName !== group) return false;
    if (mineOnly && favouriteTeamId) {
      if (it.match.homeTeamId !== favouriteTeamId && it.match.awayTeamId !== favouriteTeamId) {
        return false;
      }
    }
    return true;
  });

  // Group by Melbourne day for sectioned display.
  const byDay = new Map<string, Item[]>();
  for (const it of filtered) {
    const day = melbourneDay(it.match.kickoffAt);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(it);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {STATUS_TABS.map((t) => (
          <Chip key={t.key} active={status === t.key} onClick={() => setStatus(t.key)}>
            {t.label}
          </Chip>
        ))}
        {favouriteTeamId && (
          <Chip active={mineOnly} onClick={() => setMineOnly((v) => !v)}>
            ★ My team
          </Chip>
        )}
      </div>

      {groups.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={group === "all"} onClick={() => setGroup("all")}>
            All groups
          </Chip>
          {groups.map((g) => (
            <Chip key={g} active={group === g} onClick={() => setGroup(g)}>
              Group {g}
            </Chip>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-3xl">⚽</p>
          {items.length === 0 ? (
            <>
              <p className="mt-2 text-sm font-bold">Fixtures drop soon</p>
              <p className="mt-1 text-xs text-muted">
                The schedule loads automatically once it&apos;s published. Set your favourite team in
                Settings so we surface your group first.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">No matches match these filters.</p>
          )}
        </div>
      )}

      {[...byDay.entries()].map(([day, dayItems]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">{day}</h2>
          {dayItems.map((it) => (
            <MatchCard
              key={it.match.id}
              match={it.match}
              home={it.home}
              away={it.away}
              predictors={it.predictors}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95",
        active ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted",
      )}
    >
      {children}
    </button>
  );
}

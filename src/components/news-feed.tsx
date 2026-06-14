"use client";

import { useMemo, useState } from "react";
import type { NewsItem, Team } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { TeamFlag } from "@/components/team-flag";
import { melbourne } from "@/lib/time";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "carina" | "johnny" | "injury" | "lineup";

const CATEGORY_PILL: Record<NewsItem["category"], string> = {
  general: "bg-white/10 text-muted",
  injury: "bg-danger/20 text-danger",
  lineup: "bg-pitch/20 text-pitch",
  preview: "bg-gold/20 text-gold",
  report: "bg-[var(--accent-soft)] text-[var(--accent)]",
  rumour: "bg-white/10 text-muted",
};

const CATEGORY_LABEL: Record<NewsItem["category"], string> = {
  general: "News",
  injury: "Injury",
  lineup: "Lineup",
  preview: "Preview",
  report: "Report",
  rumour: "Rumour",
};

export function NewsFeed({
  news,
  teamsById,
  userFavTeams,
}: {
  news: NewsItem[];
  teamsById: Record<string, Team>;
  userFavTeams: { carina?: string; johnny?: string };
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const chips = useMemo(() => {
    const base: { key: FilterKey; label: string; show: boolean }[] = [
      { key: "all", label: "All", show: true },
      { key: "carina", label: "🇨🇴 Carina's team", show: !!userFavTeams.carina },
      { key: "johnny", label: "🍀 Johnny's team", show: !!userFavTeams.johnny },
      { key: "injury", label: "Injuries", show: true },
      { key: "lineup", label: "Lineups", show: true },
    ];
    return base.filter((c) => c.show);
  }, [userFavTeams.carina, userFavTeams.johnny]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "carina":
        return userFavTeams.carina
          ? news.filter((n) => n.teamIds?.includes(userFavTeams.carina!))
          : news;
      case "johnny":
        return userFavTeams.johnny
          ? news.filter((n) => n.teamIds?.includes(userFavTeams.johnny!))
          : news;
      case "injury":
        return news.filter((n) => n.category === "injury");
      case "lineup":
        return news.filter((n) => n.category === "lineup");
      default:
        return news;
    }
  }, [filter, news, userFavTeams.carina, userFavTeams.johnny]);

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(c.key)}
            className={cn(
              "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-bold transition active:scale-[0.97]",
              filter === c.key
                ? "bg-[var(--accent)] text-black accent-glow"
                : "bg-surface-2 text-muted hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="text-sm text-muted">No stories match this filter yet.</Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((n) => {
            const teams = (n.teamIds ?? [])
              .map((id) => teamsById[id])
              .filter((t): t is Team => Boolean(t));
            return (
              <Card key={n.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      CATEGORY_PILL[n.category],
                    )}
                  >
                    {CATEGORY_LABEL[n.category]}
                  </span>
                  {teams.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1">
                      {teams.map((t) => (
                        <TeamFlag key={t.id} team={t} size={22} />
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-base font-bold leading-snug">{n.title}</p>
                <p className="text-sm leading-relaxed text-muted">{n.summary}</p>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <span className="font-semibold text-foreground">{n.source}</span>
                  <span>·</span>
                  <span>{melbourne(n.publishedAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

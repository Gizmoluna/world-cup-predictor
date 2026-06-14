"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, RefreshCw } from "lucide-react";
import type { FactCategory, WorldCupFact } from "@/lib/types";
import { cn } from "@/lib/utils";

const CAT: Record<FactCategory, { label: string; icon: string }> = {
  live: { label: "Live", icon: "📡" },
  record: { label: "Records", icon: "🏅" },
  history: { label: "History", icon: "📜" },
  player: { label: "Players", icon: "⭐" },
  host2026: { label: "2026", icon: "🌎" },
  stat: { label: "Stats", icon: "📊" },
  rivalry: { label: "Rivalry", icon: "⚔️" },
  trivia: { label: "Trivia", icon: "💡" },
};

const FILTERS: ("all" | FactCategory)[] = [
  "all", "live", "rivalry", "record", "history", "player", "host2026", "trivia",
];

export function FactsFeed({
  facts,
  generatedAt,
}: {
  facts: WorldCupFact[];
  generatedAt: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | FactCategory>("all");
  const [seed, setSeed] = useState(0);
  const [secs, setSecs] = useState(0);

  // "Updates live" — pull fresh derived facts from the server periodically,
  // and tick a relative timer so it's visibly live.
  useEffect(() => {
    setSecs(0);
    const tick = setInterval(() => setSecs((s) => s + 1), 1000);
    const refresh = setInterval(() => router.refresh(), 45_000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  }, [router, generatedAt]);

  const present = useMemo(() => {
    const set = new Set(facts.map((f) => f.category));
    return FILTERS.filter((c) => c === "all" || set.has(c));
  }, [facts]);

  const shown = useMemo(() => {
    const base = filter === "all" ? facts : facts.filter((f) => f.category === filter);
    if (seed === 0) return base;
    // deterministic-ish shuffle driven by the shuffle button
    return [...base].sort((a, b) => hash(a.id + seed) - hash(b.id + seed));
  }, [facts, filter, seed]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-pitch" />
          Updates live · {secs < 2 ? "just now" : `${secs}s ago`}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => router.refresh()} className="flex items-center gap-1 hover:text-foreground">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setSeed((s) => s + 1)} className="flex items-center gap-1 hover:text-foreground">
            <Shuffle size={13} /> Shuffle
          </button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {present.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95",
              filter === c ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted",
            )}
          >
            {c === "all" ? "All" : `${CAT[c].icon} ${CAT[c].label}`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {shown.map((f) => (
          <div key={f.id} className="glass flex items-start gap-3 p-4">
            <span className="text-2xl leading-none">{CAT[f.category].icon}</span>
            <div className="flex-1">
              <p className="text-sm leading-snug">{f.text}</p>
              <div className="mt-1.5 flex items-center gap-2">
                {f.live && (
                  <span className="rounded-full bg-pitch/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-pitch">
                    Live
                  </span>
                )}
                <span className="text-[10px] uppercase tracking-wide text-muted">{f.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="py-4 text-center text-xs text-muted">
        That&apos;s all {shown.length} facts {filter !== "all" ? `in ${CAT[filter as FactCategory].label}` : ""} — more roll in as matches are played.
      </p>
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

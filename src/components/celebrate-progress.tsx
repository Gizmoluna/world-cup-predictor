"use client";

import { useEffect, useState } from "react";
import { Confetti } from "./confetti";

interface BadgeLite {
  id: string;
  name: string;
  icon: string;
}

// Detects what's NEW since this device last saw the player's progress — newly
// unlocked badges and level-ups — and pops a one-off celebration (confetti +
// dismissible banner). First ever load just records a baseline silently, so we
// don't blast a celebration for a backlog of already-earned badges.
export function CelebrateProgress({
  earnedBadges,
  level,
  levelTitle,
}: {
  earnedBadges: BadgeLite[];
  level: number;
  levelTitle: string;
}) {
  const [items, setItems] = useState<string[] | null>(null);

  useEffect(() => {
    const SEEN_BADGES = "wcp_seen_badges";
    const SEEN_LEVEL = "wcp_seen_level";
    const INIT = "wcp_progress_init";
    try {
      const initialised = localStorage.getItem(INIT);
      const seenBadges = new Set<string>(JSON.parse(localStorage.getItem(SEEN_BADGES) || "[]"));
      const seenLevel = Number(localStorage.getItem(SEEN_LEVEL) || "0");

      // Always record the current state.
      localStorage.setItem(SEEN_BADGES, JSON.stringify(earnedBadges.map((b) => b.id)));
      localStorage.setItem(SEEN_LEVEL, String(level));
      localStorage.setItem(INIT, "1");

      if (!initialised) return; // first run on this device → baseline only

      const celebrate: string[] = [];
      if (level > seenLevel) celebrate.push(`🎖️ Levelled up — you're now ${levelTitle}!`);
      for (const b of earnedBadges) {
        if (!seenBadges.has(b.id)) celebrate.push(`${b.icon} ${b.name} unlocked!`);
      }
      if (celebrate.length) setItems(celebrate);
    } catch {
      /* private mode / no storage — skip */
    }
  }, [earnedBadges, level, levelTitle]);

  // Auto-dismiss after a few seconds.
  useEffect(() => {
    if (!items) return;
    const t = setTimeout(() => setItems(null), 6000);
    return () => clearTimeout(t);
  }, [items]);

  if (!items) return null;

  return (
    <>
      <Confetti big sound />
      <button
        onClick={() => setItems(null)}
        className="fixed inset-x-0 bottom-24 z-[120] mx-auto flex w-[min(92%,26rem)] flex-col items-center gap-1 rounded-2xl border border-[var(--accent)]/50 bg-surface/95 p-4 text-center shadow-2xl backdrop-blur-xl animate-rise"
      >
        <span className="title-bc text-base text-[var(--accent)]">Achievement{items.length > 1 ? "s" : ""} unlocked! 🎉</span>
        {items.map((t, i) => (
          <span key={i} className="text-sm font-bold">{t}</span>
        ))}
        <span className="mt-1 text-[10px] uppercase tracking-widest text-muted">tap to dismiss</span>
      </button>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Auto-refreshes the current server-rendered page on an interval while a match
// is live, so scores/events update without a manual reload. Pauses when the tab
// is backgrounded (saves battery + API calls) and resumes on return. Renders a
// small "live · updating" pill so it's clear why things move on their own.
export function LiveRefresher({
  active,
  intervalMs = 45000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      setPulse(true);
      router.refresh();
      setTimeout(() => setPulse(false), 900);
    };
    const id = setInterval(tick, intervalMs);
    // Refresh immediately when the user returns to the tab.
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, intervalMs, router]);

  if (!active) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-danger/40 bg-surface/90 px-3 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur-xl">
      <span className="text-danger">●</span> Live · {pulse ? "updating…" : "auto-updates"}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

// Fetches a short AI blurb (preview or banter) from an API route after the page
// has rendered, so the page is never blocked on the model. Shows a subtle
// shimmer while loading and renders nothing if the route returns 204 (AI not
// configured, or nothing worth saying) — graceful degradation by default.
export function AiBlurb({
  endpoint,
  label,
  icon = "✨",
}: {
  endpoint: string; // e.g. "/api/ai/preview?matchId=f6"
  label: string; // e.g. "AI preview"
  icon?: string;
}) {
  const [state, setState] = useState<"loading" | "done" | "hidden">("loading");
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(endpoint)
      .then(async (r) => {
        if (!alive) return;
        if (r.status === 204 || !r.ok) {
          setState("hidden");
          return;
        }
        const data = await r.json().catch(() => null);
        if (!alive) return;
        if (data?.text) {
          setText(data.text);
          setState("done");
        } else {
          setState("hidden");
        }
      })
      .catch(() => alive && setState("hidden"));
    return () => {
      alive = false;
    };
  }, [endpoint]);

  if (state === "hidden") return null;

  return (
    <div className="glass overflow-hidden p-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
        <span>{icon}</span> {label}
      </div>
      {state === "loading" ? (
        <div className="space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed">{text}</p>
      )}
    </div>
  );
}

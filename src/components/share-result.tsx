"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareResult({
  matchId,
  name,
  pts,
  tag,
  label,
}: {
  matchId: string;
  name: string;
  pts?: number;
  tag?: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  function url() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const q = new URLSearchParams({ name });
    if (pts != null) q.set("pts", String(pts));
    if (tag) q.set("tag", tag);
    return `${origin}/api/share/${matchId}?${q.toString()}`;
  }

  async function share() {
    const link = url();
    const text = `${label} — World Cup Predictor`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "World Cup Predictor", text, url: link });
        return;
      } catch {
        /* cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.open(link, "_blank");
    }
  }

  return (
    <button
      onClick={share}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/8 py-2.5 text-sm font-bold transition active:scale-95"
    >
      {copied ? <Check size={16} className="text-pitch" /> : <Share2 size={16} />}
      {copied ? "Link copied" : "Share result card"}
    </button>
  );
}

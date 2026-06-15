"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

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

  function link() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const q = new URLSearchParams({ name });
    if (pts != null) q.set("pts", String(pts));
    if (tag) q.set("tag", tag);
    return `${origin}/r/${matchId}?${q.toString()}`;
  }

  const message = `${label} — play World Cup Predictor:`;

  async function nativeShare() {
    const url = link();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "World Cup Predictor", text: message, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    copy();
  }

  function copy() {
    navigator.clipboard?.writeText(`${message} ${link()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const waHref = () => `https://wa.me/?text=${encodeURIComponent(`${message} ${link()}`)}`;

  const tile = "flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-2 py-3 text-xs font-bold transition active:scale-95";

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={nativeShare}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black transition active:scale-[0.98]"
      >
        <Share2 size={16} /> Share result card
      </button>
      <div className="grid grid-cols-2 gap-2">
        <a className={tile} href={waHref()} target="_blank" rel="noopener noreferrer">
          <span className="text-lg">💬</span> WhatsApp
        </a>
        <button className={tile} onClick={copy}>
          {copied ? <Check size={18} className="text-pitch" /> : <Copy size={18} />} {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

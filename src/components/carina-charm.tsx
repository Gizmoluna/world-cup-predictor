"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Sweet nothings + silly jokes for Carina. Shown at most once per session so it
// charms, never spams. When she's left picks unmade she gets a cheeky
// "perezosa" nudge instead.
const SWEET = [
  "Hey Bonny 💛",
  "Looking guapa today, Carina 😍",
  "Just saying — you're better than Victoria. Every single time.",
  "Scientific fact: you clean better than Diana 🧹✨",
  "Bonny, guapa, AND beating Johnny? Completely unfair.",
  "What do you call a fake noodle? An impasta 🍝 (you'd never serve one, guapa).",
  "Why don't eggs tell jokes? They'd crack each other up 🥚😄",
  "Reminder: you're the guapa one in this league, Bonny.",
];

const PEREZOSA = [
  "Oye perezosa 😏 your picks won't make themselves.",
  "Perezosa! 🛋️ Johnny's already locked in — tap Matches, guapa.",
  "Less relaxing, more predicting, perezosa 💛 (still the guapa one though).",
  "Bonny, don't be perezosa — there are points sitting there with your name on them.",
];

export function CarinaCharm({ lazy = false }: { lazy?: boolean }) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("carinaCharmSeen")) return;
    sessionStorage.setItem("carinaCharmSeen", "1");
    const pool = lazy ? PEREZOSA : SWEET;
    setLine(pool[Math.floor(Math.random() * pool.length)]);
  }, [lazy]);

  if (!line) return null;

  return (
    <div className={cn("glass card-bc flex items-center gap-3 p-4 ring-1", lazy ? "ring-gold/40" : "ring-pink-400/40")}>
      <span className="text-2xl">{lazy ? "😏" : "💛"}</span>
      <p className="flex-1 text-sm font-semibold">{line}</p>
      <button
        onClick={() => setLine(null)}
        aria-label="Dismiss"
        className="shrink-0 rounded-full bg-white/8 px-2 py-1 text-xs font-bold text-muted transition active:scale-90"
      >
        ✕
      </button>
    </div>
  );
}

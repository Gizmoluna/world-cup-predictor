"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { playSuccess } from "@/lib/sound";

/**
 * Celebratory burst. Pass `dedupeKey` to fire only once per key per device
 * (so revisiting a finished match doesn't re-blast). `big` for exact scores.
 */
export function Confetti({
  fire = true,
  dedupeKey,
  big = false,
  sound = false,
}: {
  fire?: boolean;
  dedupeKey?: string;
  big?: boolean;
  sound?: boolean;
}) {
  useEffect(() => {
    if (!fire) return;
    if (dedupeKey) {
      const k = `cvj_confetti_${dedupeKey}`;
      try {
        if (localStorage.getItem(k)) return;
        localStorage.setItem(k, "1");
      } catch {
        /* private mode — just fire */
      }
    }

    if (sound) playSuccess(big);

    const colors = ["#ffd34d", "#2ecc71", "#ffffff", "#ff4d6d", "#38bdf8"];
    const duration = big ? 1800 : 900;
    const rate = big ? 6 : 4;

    if (big) {
      // opening pop from the centre
      confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.4 }, colors });
    }

    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: rate, angle: 60, spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: rate, angle: 120, spread: 65, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [fire, dedupeKey, big, sound]);

  return null;
}

"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

/** Fires a celebratory burst once on mount. Used on matchday wins. */
export function Confetti({ fire = true }: { fire?: boolean }) {
  useEffect(() => {
    if (!fire) return;
    const end = Date.now() + 900;
    const colors = ["#fcd116", "#2ecc71", "#ffffff", "#ff4d6d"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 65, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 65, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [fire]);
  return null;
}

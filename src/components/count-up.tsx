"use client";

import { useEffect, useRef, useState } from "react";

/** Animates a number from 0 → value on mount (broadcast-style count-up). */
export function CountUp({
  value,
  duration = 700,
  prefix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setN(Math.round(from + (value - from) * eased));
      if (t < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {n}
    </span>
  );
}

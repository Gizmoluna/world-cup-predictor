"use client";

import { useEffect, useState } from "react";
import { countdown } from "@/lib/time";

export function Countdown({ kickoffAt }: { kickoffAt: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="tabular-nums">—</span>;
  return <span className="tabular-nums">{countdown(kickoffAt, now)}</span>;
}

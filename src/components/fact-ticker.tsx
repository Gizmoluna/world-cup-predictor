"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lightbulb, ChevronRight } from "lucide-react";
import type { WorldCupFact } from "@/lib/types";

/** Rotating "Did you know?" fact on the dashboard, cycling every few seconds. */
export function FactTicker({ facts }: { facts: WorldCupFact[] }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (facts.length <= 1) return;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setI((p) => (p + 1) % facts.length);
        setShow(true);
      }, 250);
    }, 6000);
    return () => clearInterval(id);
  }, [facts.length]);

  if (!facts.length) return null;
  const f = facts[i];

  return (
    <Link href="/facts" className="glass flex items-center gap-3 p-4 transition active:scale-[0.99]">
      <Lightbulb className="shrink-0 text-gold" size={20} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Did you know?</p>
        <p
          className="text-sm font-semibold leading-snug transition-opacity duration-200"
          style={{ opacity: show ? 1 : 0 }}
        >
          {f.text}
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-[var(--accent)]" />
    </Link>
  );
}

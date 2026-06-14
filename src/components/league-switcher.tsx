"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Users, Plus } from "lucide-react";
import { setActiveLeague } from "@/app/actions";

interface LeagueLite {
  id: string;
  name: string;
}

export function LeagueSwitcher({
  active,
  leagues,
}: {
  active: LeagueLite;
  leagues: LeagueLite[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function change(id: string) {
    start(async () => {
      await setActiveLeague(id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Users size={14} />
        {leagues.length > 1 ? (
          <select
            value={active.id}
            disabled={pending}
            onChange={(e) => change(e.target.value)}
            className="bg-transparent font-bold text-foreground outline-none"
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id} className="bg-surface">
                {l.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-bold text-foreground">{active.name}</span>
        )}
      </div>
      <Link href="/leagues" className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)]">
        <Plus size={13} /> Leagues
      </Link>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGroupPick } from "@/app/actions";
import { cn } from "@/lib/utils";

interface GroupTeam {
  id: string;
  name: string;
  flagUrl: string;
}
interface GroupData {
  name: string;
  decidedWinnerId: string | null;
  pickedId: string | null;
  teams: GroupTeam[];
}

export function GroupPicks({ groups }: { groups: GroupData[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [picks, setPicks] = useState<Record<string, string | null>>(
    Object.fromEntries(groups.map((g) => [g.name, g.pickedId])),
  );

  function pick(group: string, teamId: string) {
    setPicks((p) => ({ ...p, [group]: teamId }));
    start(async () => {
      await saveGroupPick(group, teamId);
      router.refresh();
    });
  }

  if (groups.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No groups available yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => {
        const picked = picks[g.name];
        const decided = g.decidedWinnerId;
        return (
          <div key={g.name} className="glass p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--accent)]">{g.name}</h2>
              {decided && (
                <span
                  className={cn(
                    "text-[11px] font-bold",
                    picked === decided ? "text-pitch" : "text-danger",
                  )}
                >
                  {picked === decided ? "✓ +10 pts" : "✗ missed"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {g.teams.map((t) => {
                const isPick = picked === t.id;
                const isWinner = decided === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => !decided && pick(g.name, t.id)}
                    disabled={!!decided}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-95",
                      isPick ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-border bg-surface-2",
                      isWinner && "ring-1 ring-pitch",
                      decided && "opacity-80",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.flagUrl} alt="" className="h-4 w-6 rounded object-cover" />
                    <span className="truncate">{t.name}</span>
                    {isPick && <span className="ml-auto text-[var(--accent)]">●</span>}
                    {isWinner && <span className="ml-auto text-pitch">🥇</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

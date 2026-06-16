"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickerPlayer {
  id: string;
  name: string;
  position?: string | null;
  flagUrl?: string | null;
}

// Forwards are likeliest to score, then mids, defenders, keepers last —
// a sensible proxy for "odds to score" without a paid odds feed.
function scoreRank(pos?: string | null): number {
  const p = (pos ?? "").toUpperCase();
  if (/^(F|ST|CF|LW|RW|W|FW)/.test(p) || p.includes("FORWARD") || p.includes("STRIKER") || p.includes("WING")) return 0;
  if (/^(G|GK)/.test(p) || p.includes("KEEP")) return 3;
  if (/^(D|CB|LB|RB|WB)/.test(p) || p.includes("BACK") || p.includes("DEF")) return 2;
  return 1; // midfield / unknown
}

function Flag({ url }: { url?: string | null }) {
  if (!url) return <span className="inline-block h-4 w-6 rounded bg-white/10" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className="h-4 w-6 shrink-0 rounded object-cover" />;
}

export function PlayerPicker({
  players,
  value,
  onChange,
  placeholder = "Pick a player",
}: {
  players: PickerPlayer[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const sorted = useMemo(
    () => [...players].sort((a, b) => scoreRank(a.position) - scoreRank(b.position) || a.name.localeCompare(b.name)),
    [players],
  );
  const selected = players.find((p) => p.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-left text-base outline-none focus:border-[var(--accent)]"
      >
        {selected ? (
          <>
            <Flag url={selected.flagUrl} />
            <span className="truncate font-semibold">{selected.name}</span>
          </>
        ) : (
          <span className="text-muted">{placeholder}</span>
        )}
        <ChevronDown size={18} className="ml-auto shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="flex w-full items-center px-4 py-2.5 text-left text-sm text-muted hover:bg-white/5"
          >
            — None —
          </button>
          {sorted.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-white/5",
                value === p.id && "bg-[var(--accent-soft)]",
              )}
            >
              <Flag url={p.flagUrl} />
              <span className="truncate font-semibold">{p.name}</span>
              {p.position && <span className="ml-auto shrink-0 text-[10px] uppercase text-muted">{p.position}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

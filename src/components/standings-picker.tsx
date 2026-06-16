"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGroupOrderPick } from "@/app/actions";
import { cn } from "@/lib/utils";

interface GTeam {
  id: string;
  name: string;
  flagUrl: string;
}
interface GroupData {
  name: string;
  decidedOrder: string[] | null;
  savedOrder: string[];
  changeCount?: number;
  penalty?: number;
  teams: GTeam[];
}

function Flag({ url }: { url: string }) {
  if (!url) return <span className="inline-block h-4 w-6 rounded bg-white/10" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className="h-4 w-6 shrink-0 rounded object-cover" />;
}

export function StandingsPicker({ groups }: { groups: GroupData[] }) {
  if (groups.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No groups yet.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <GroupRanker key={g.name} group={g} />
      ))}
    </div>
  );
}

function GroupRanker({ group }: { group: GroupData }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [order, setOrder] = useState<string[]>(group.savedOrder.filter((id) => group.teams.some((t) => t.id === id)));
  const [note, setNote] = useState<string>("");
  const teamById = new Map(group.teams.map((t) => [t.id, t]));
  const decided = group.decidedOrder;
  const hadOrder = group.savedOrder.length === group.teams.length;

  function tap(id: string) {
    if (decided) return;
    const next = order.includes(id) ? order.filter((x) => x !== id) : [...order, id];
    setOrder(next);
    if (next.length === group.teams.length) {
      start(async () => {
        const res = await saveGroupOrderPick(group.name, next);
        if (res.ok && "changed" in res && res.changed) {
          setNote(`Re-ranked — −${res.cost} pts → loyalty pot 💸 (small tweaks cost less)`);
        }
        router.refresh();
      });
    }
  }
  function reset() {
    setOrder([]);
  }

  if (decided) {
    return (
      <div className="glass card-bc p-4">
        <h2 className="title-bc mb-2 text-sm text-[var(--accent)]">{group.name} · final</h2>
        <div className="flex flex-col gap-1.5">
          {decided.map((id, i) => {
            const t = teamById.get(id);
            const youHad = group.savedOrder[i];
            const hit = youHad === id;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center font-black text-muted">{i + 1}</span>
                <Flag url={t?.flagUrl ?? ""} />
                <span className="flex-1 truncate font-semibold">{t?.name}</span>
                {group.savedOrder.length > 0 && (
                  <span className={cn("text-xs font-bold", hit ? "text-pitch" : "text-danger")}>
                    {hit ? "✓" : "✗"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const ranked = order.map((id) => teamById.get(id)!).filter(Boolean);
  const remaining = group.teams.filter((t) => !order.includes(t.id));

  return (
    <div className="glass card-bc p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="title-bc text-sm text-[var(--accent)]">{group.name}</h2>
        {order.length > 0 && (
          <button onClick={reset} className="text-[11px] font-bold text-muted">Reset</button>
        )}
      </div>

      {ranked.length > 0 && (
        <div className="mb-2 flex flex-col gap-1.5">
          {ranked.map((t, i) => (
            <button key={t.id} onClick={() => tap(t.id)} className="flex items-center gap-2 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm">
              <span className="w-5 text-center font-black text-[var(--accent)]">{i + 1}</span>
              <Flag url={t.flagUrl} />
              <span className="flex-1 truncate font-semibold text-left">{t.name}</span>
              <span className="text-[10px] text-muted">tap to remove</span>
            </button>
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {remaining.map((t) => (
            <button key={t.id} onClick={() => tap(t.id)} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm active:scale-95">
              <Flag url={t.flagUrl} />
              <span className="truncate font-semibold">{t.name}</span>
            </button>
          ))}
        </div>
      )}
      {hadOrder && order.length < group.teams.length && (
        <p className="mt-2 text-[11px] font-bold text-danger">
          ⚠️ Re-ranking a locked order costs points (escalating) — but a small swap costs far less than a full rebuild.
        </p>
      )}
      {note && order.length === group.teams.length && (
        <p className="mt-2 text-[11px] font-bold text-danger">{note}</p>
      )}
      {!note && order.length === group.teams.length && (
        <p className="mt-2 text-[11px] font-bold text-pitch">
          Order locked in ✓ (tap a team to change · {group.penalty ? `−${group.penalty} pts so far` : "free until you change"})
        </p>
      )}
    </div>
  );
}

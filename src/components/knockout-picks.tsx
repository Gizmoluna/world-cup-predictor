"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveKnockoutPick, saveKnockoutMethodPick } from "@/app/actions";
import { changePenaltyFor } from "@/lib/scoring/points";
import { ChangeConfirmBar } from "@/components/change-confirm-bar";
import { cn } from "@/lib/utils";

const METHODS: { key: "90" | "ET" | "PENS"; label: string }[] = [
  { key: "90", label: "90′" },
  { key: "ET", label: "Extra time" },
  { key: "PENS", label: "Penalties" },
];

const STAGE: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  third_place: "Third place",
  final: "FINAL",
};

interface KTeam {
  id: string;
  name: string;
  flagUrl: string;
}
interface KItem {
  matchId: string;
  stage: string;
  ready: boolean;
  locked: boolean;
  winnerId: string | null;
  pickedId: string | null;
  method: "90" | "ET" | "PENS" | null;
  methodActual: string | null;
  changeCount: number;
  penalty?: number;
  home: KTeam | null;
  away: KTeam | null;
}

export function KnockoutPicks({ items }: { items: KItem[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [picks, setPicks] = useState<Record<string, string | null>>(
    Object.fromEntries(items.map((i) => [i.matchId, i.pickedId])),
  );
  const [note, setNote] = useState<Record<string, string>>({});
  // matchId -> team they want to switch to, awaiting confirmation.
  const [pending, setPending] = useState<Record<string, string | null>>({});

  function tap(matchId: string, teamId: string, locked: boolean, current: string | null) {
    if (locked) return;
    if (!current || current === teamId) {
      commit(matchId, teamId);
      return;
    }
    setPending((p) => ({ ...p, [matchId]: teamId }));
  }

  function commit(matchId: string, teamId: string) {
    setPending((p) => ({ ...p, [matchId]: null }));
    setPicks((p) => ({ ...p, [matchId]: teamId }));
    start(async () => {
      const res = await saveKnockoutPick(matchId, teamId);
      if (res.ok && res.changed) {
        setNote((n) => ({ ...n, [matchId]: `Changed — −${res.cost} pts → loyalty pot 💸` }));
      }
      router.refresh();
    });
  }

  const [methods, setMethods] = useState<Record<string, string | null>>(
    Object.fromEntries(items.map((i) => [i.matchId, i.method])),
  );
  function pickMethod(matchId: string, m: "90" | "ET" | "PENS") {
    setMethods((x) => ({ ...x, [matchId]: m }));
    start(async () => { await saveKnockoutMethodPick(matchId, m); router.refresh(); });
  }

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No knockout fixtures yet.</p>;
  }

  // group by stage for section headers
  let lastStage = "";

  return (
    <div className="flex flex-col gap-3">
      {items.map((it) => {
        const showStage = it.stage !== lastStage;
        lastStage = it.stage;
        const picked = picks[it.matchId];
        return (
          <div key={it.matchId}>
            {showStage && (
              <h2 className="title-bc mb-1 mt-3 text-xs tracking-[0.16em] text-[var(--accent)]">
                {STAGE[it.stage] ?? it.stage}
              </h2>
            )}
            <div className="glass card-bc p-3">
              {!it.ready ? (
                <p className="py-2 text-center text-sm text-muted">Teams confirmed after the group stage</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {[it.home!, it.away!].map((t) => {
                      const isPick = picked === t.id;
                      const isWinner = it.winnerId === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => tap(it.matchId, t.id, it.locked, picked)}
                          disabled={it.locked}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition active:scale-95",
                            isPick ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-border bg-surface-2",
                            isWinner && "ring-1 ring-pitch",
                            it.locked && "opacity-80",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.flagUrl} alt="" loading="lazy" className="h-4 w-6 rounded object-cover" />
                          <span className="truncate">{t.name}</span>
                          {isPick && <span className="ml-auto text-[var(--accent)]">●</span>}
                          {isWinner && <span className="ml-auto text-pitch">🏆</span>}
                        </button>
                      );
                    })}
                  </div>
                  {picked && (
                    <div className="mt-2">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Decided in · +4</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {METHODS.map((mo) => {
                          const on = methods[it.matchId] === mo.key;
                          const actualHit = it.methodActual === mo.key;
                          return (
                            <button
                              key={mo.key}
                              onClick={() => !it.locked && pickMethod(it.matchId, mo.key)}
                              disabled={it.locked}
                              className={cn(
                                "rounded-lg py-1.5 text-[11px] font-bold transition active:scale-95",
                                on ? "bg-[var(--accent)] text-black" : "bg-surface-2",
                                it.methodActual && actualHit && "ring-1 ring-pitch",
                              )}
                            >
                              {mo.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {pending[it.matchId] && (
                    <ChangeConfirmBar
                      cost={changePenaltyFor(it.changeCount + 1)}
                      changeNumber={it.changeCount + 1}
                      busy={busy}
                      onConfirm={() => commit(it.matchId, pending[it.matchId]!)}
                      onCancel={() => setPending((p) => ({ ...p, [it.matchId]: null }))}
                    />
                  )}
                  {!pending[it.matchId] && (note[it.matchId] || it.changeCount > 0) && (
                    <p className="mt-1.5 text-[11px] text-danger">
                      {note[it.matchId] ?? `Changed ×${it.changeCount} (−${it.penalty ?? 0} pts to loyal rivals)`}
                    </p>
                  )}
                  {it.locked && it.winnerId && (
                    <p className="mt-1.5 text-[11px] text-muted">
                      {picked === it.winnerId ? "✓ +8 pts" : picked ? "✗ missed" : "no pick"}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

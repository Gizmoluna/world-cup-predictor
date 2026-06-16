"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coins } from "lucide-react";
import { proposePotAction, joinPotAction } from "@/app/actions";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { PotCriteria } from "@/lib/types";

const CRITERIA: { key: PotCriteria; label: string; blurb: string }[] = [
  { key: "SCORE", label: "Correct score", blurb: "Closest 90′ scoreline wins" },
  { key: "RESULT", label: "Match result", blurb: "Everyone who calls the outcome splits it" },
  { key: "FIRST_SCORER", label: "First goalscorer", blurb: "Name the first scorer" },
];

export interface PotView {
  id: string;
  ante: number;
  criteria: PotCriteria;
  proposerName: string;
  entrants: { name: string; flag: string }[];
  joined: boolean;
  settled: boolean;
  isVoid: boolean;
  winners: { name: string; flag: string }[];
  myPayout: number | null;
}

const critLabel = (c: PotCriteria) => CRITERIA.find((x) => x.key === c)?.label ?? c;

export function GroupPots({
  matchId,
  pots,
  canPlay,
  locked,
}: {
  matchId: string;
  pots: PotView[];
  canPlay: boolean; // in a league with rivals
  locked: boolean; // past kickoff — no new pots/joins
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [ante, setAnte] = useState(20);
  const [criteria, setCriteria] = useState<PotCriteria>("SCORE");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function propose() {
    setMsg(null);
    start(async () => {
      const res = await proposePotAction(matchId, ante, criteria);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });
  }
  function join(potId: string) {
    start(async () => {
      await joinPotAction(potId, matchId);
      router.refresh();
    });
  }

  if (!canPlay && pots.length === 0) return null;

  return (
    <div className="glass card-bc flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Coins size={18} className="text-gold" />
        <span className="title-bc text-sm">Group pots</span>
        <span className="ml-auto text-[11px] text-muted">whole league · winner takes all</span>
      </div>

      {pots.map((p) => {
        const pot = p.ante * p.entrants.length;
        return (
          <div key={p.id} className="rounded-xl bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{critLabel(p.criteria)}</span>
              <span className="num-bc text-lg text-gold">${pot}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted">
              ${p.ante} ante · {p.entrants.length} in: {p.entrants.map((e) => e.flag).join(" ")}
            </p>

            {p.settled ? (
              <p className="mt-1.5 text-xs font-bold">
                {p.isVoid ? (
                  <span className="text-muted">No winner — stakes refunded.</span>
                ) : (
                  <span className="text-pitch">
                    🏆 {p.winners.map((w) => `${w.flag} ${w.name}`).join(", ")}
                    {p.myPayout != null && p.myPayout !== 0 && (
                      <span className={p.myPayout > 0 ? "text-pitch" : "text-danger"}>
                        {" "}· you {p.myPayout > 0 ? "+" : "−"}${Math.abs(p.myPayout)}
                      </span>
                    )}
                  </span>
                )}
              </p>
            ) : p.joined ? (
              <p className="mt-1.5 text-xs font-bold text-pitch">✓ You&apos;re in</p>
            ) : locked ? (
              <p className="mt-1.5 text-xs text-muted">Locked — kickoff passed</p>
            ) : (
              <button
                onClick={() => join(p.id)}
                disabled={pending}
                className="mt-2 w-full rounded-lg bg-pitch py-2 text-xs font-black text-black transition active:scale-95 disabled:opacity-60"
              >
                Match ${p.ante} & join
              </button>
            )}
          </div>
        );
      })}

      {canPlay && !locked && (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-left text-xs font-bold text-[var(--accent)]"
          >
            {open ? "− Cancel" : "+ Start a group pot"}
          </button>
          {open && (
            <div className="flex flex-col gap-3 rounded-xl bg-surface-2 p-3">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted">Win it by</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {CRITERIA.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCriteria(c.key)}
                      className={cn(
                        "rounded-lg px-2 py-1.5 text-[11px] font-bold transition active:scale-95",
                        criteria === c.key ? "bg-[var(--accent)] text-black" : "bg-white/8",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  {CRITERIA.find((c) => c.key === criteria)?.blurb}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="num-bc text-2xl text-gold">${ante}</span>
                <span className="text-xs text-muted">ante per player</span>
              </div>
              <input
                type="range" min={5} max={100} step={5}
                value={ante}
                onChange={(e) => setAnte(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <Button variant="accent" disabled={pending} onClick={propose}>
                Open the pot
              </Button>
            </div>
          )}
        </>
      )}

      {msg && !msg.ok && <p className="text-xs font-bold text-danger">{msg.text}</p>}
    </div>
  );
}

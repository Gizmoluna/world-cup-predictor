"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { challengeFriendAction } from "@/app/actions";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  flag: string;
}

export function DuelChallenge({ matchId, friends }: { matchId: string; friends: Friend[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opp, setOpp] = useState(friends[0]?.id ?? "");
  const [stake, setStake] = useState(30);
  const [mode, setMode] = useState<"SCORE" | "SPLIT">("SCORE");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // SPLIT divides the stake three ways — snap to a multiple of 3 for clean legs.
  const effectiveStake = mode === "SPLIT" ? Math.max(3, Math.round(stake / 3) * 3) : stake;
  const legShare = Math.floor(effectiveStake / 3);

  if (friends.length === 0) {
    return (
      <div className="glass card-bc p-4 text-sm text-muted">
        ⚔️ Add a friend to wager on the score. (Leagues → Find players)
      </div>
    );
  }

  function challenge() {
    setMsg(null);
    start(async () => {
      const res = await challengeFriendAction(matchId, opp, effectiveStake, mode);
      if (res.ok) {
        setMsg({ ok: true, text: "Challenge sent! 💵" });
        setOpen(false);
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <div className="glass card-bc p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
        <Swords size={18} className="text-[var(--accent)]" />
        <span className="title-bc text-sm">Duel a friend on the score</span>
        <span className="ml-auto text-xs text-muted">90′ score · {open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <select
            value={opp}
            onChange={(e) => setOpp(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm font-semibold outline-none focus:border-[var(--accent)]"
          >
            {friends.map((f) => (
              <option key={f.id} value={f.id}>{f.flag} {f.name}</option>
            ))}
          </select>

          {/* Wager mode: full stake on the score, or split across markets. */}
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { key: "SCORE", label: "Full · correct score" },
              { key: "SPLIT", label: "Split · across markets" },
            ] as const).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={cn(
                  "rounded-lg px-2 py-2 text-[11px] font-bold transition active:scale-95",
                  mode === m.key ? "bg-[var(--accent)] text-black" : "bg-white/8",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            {mode === "SCORE"
              ? "Whole stake on the closest 90′ scoreline. Winner takes the pot."
              : `$${legShare} each on closest score, match result & first scorer — each leg settled on its own.`}
          </p>

          <div className="flex items-center justify-between">
            <span className="num-bc text-2xl text-pitch">${effectiveStake}</span>
            <span className="text-xs text-muted">
              {mode === "SCORE" ? `winner takes $${effectiveStake * 2}` : `3 × $${legShare} legs`}
            </span>
          </div>
          <input
            type="range" min={6} max={99} step={3}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full accent-pitch"
          />
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                className={cn("rounded-lg py-2 text-xs font-bold", stake === v ? "bg-pitch text-black" : "bg-white/8")}
              >
                ${v}
              </button>
            ))}
          </div>
          <Button variant="accent" disabled={pending || !opp} onClick={challenge}>
            Send challenge
          </Button>
        </div>
      )}
      {msg && <p className={cn("mt-2 text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>{msg.text}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { spyRevealAction } from "@/app/actions";

// Pay-to-peek: a rival's upcoming pick stays hidden until you spend the fee
// (which funds the league Spy Pot). Two-tap so nobody spends by accident.
export function SpyButton({
  targetId,
  targetName,
  matchId,
  fee,
}: {
  targetId: string;
  targetName: string;
  matchId: string;
  fee: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function buy() {
    setErr(null);
    start(async () => {
      const r = await spyRevealAction(targetId, matchId);
      if (r.ok) router.refresh();
      else {
        setErr(r.error ?? "Failed");
        setConfirming(false);
      }
    });
  }

  return (
    <div className="glass flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-2">
        <EyeOff size={18} className="shrink-0 text-muted" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{targetName}&apos;s pick is hidden</p>
          <p className="text-[11px] text-muted">Pay into the Spy Pot to reveal it before kickoff.</p>
        </div>
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={buy}
            disabled={pending}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-black text-black transition active:scale-95 disabled:opacity-50"
          >
            <Eye size={15} /> Pay ${fee}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded-xl bg-white/8 px-3 py-2 text-sm font-bold text-muted transition active:scale-95"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2 text-sm font-bold transition active:scale-95"
        >
          🕵️ Spy · ${fee}
        </button>
      )}
      {err && <span className="text-[10px] font-bold text-danger">{err}</span>}
    </div>
  );
}

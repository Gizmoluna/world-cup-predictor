"use client";

import Link from "next/link";

// Inline "are you sure?" bar shown before a futures pick is changed. Makes the
// escalating cost explicit BEFORE points are lost, and frames the gamified
// stakes: the forfeited points are paid out to rivals who hold their nerve.

export function ChangeConfirmBar({
  cost,
  changeNumber,
  busy,
  onConfirm,
  onCancel,
  label,
}: {
  cost: number;
  changeNumber: number;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  label?: string;
}) {
  return (
    <div className="mt-2 animate-rise rounded-xl border border-danger/40 bg-danger/10 p-3">
      <p className="text-[12px] font-bold leading-snug">
        💸 {label ?? "Change your pick?"} This costs{" "}
        <span className="text-danger">−{cost} pts</span>
        {changeNumber > 1 ? ` (change #${changeNumber} — the price climbs each flip)` : ""}.
      </p>
      <p className="mt-0.5 text-[11px] text-muted">
        Your forfeited points are split among rivals who don&apos;t change. Conviction pays.{" "}
        <Link href="/how-it-works#penalties" className="font-bold text-[var(--accent)]">
          How this works
        </Link>
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex-1 rounded-lg bg-danger px-3 py-2 text-[12px] font-black text-white transition active:scale-95 disabled:opacity-60"
        >
          {busy ? "Changing…" : `Change anyway (−${cost})`}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-[12px] font-bold transition active:scale-95"
        >
          Keep current
        </button>
      </div>
    </div>
  );
}

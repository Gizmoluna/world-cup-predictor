import { cn } from "@/lib/utils";

export interface WagerRow {
  name: string;
  flag: string;
  stake: number;
  /** null while the match is in play; +/− once settled. */
  profit: number | null;
}

export interface DuelRow {
  aName: string;
  aFlag: string;
  bName: string;
  bFlag: string;
  stake: number;
  mode: "SCORE" | "SPLIT";
  settled: boolean;
  /** Winner's name once settled; null = push (money back) or still in play. */
  winnerName: string | null;
  /** Absolute amount that moved (settled only). */
  amount: number;
}

// All the side-bet action on one match — solo wagers and head-to-head duels —
// for the live and finished views. Picks themselves render separately; this is
// the money on the line and who won it.
export function MatchBets({
  wagers,
  duels,
  live,
}: {
  wagers: WagerRow[];
  duels: DuelRow[];
  live: boolean;
}) {
  if (wagers.length === 0 && duels.length === 0) return null;

  return (
    <div className="glass flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="title-bc text-sm text-[var(--accent)]">💸 Bets on this match</h2>
        {live && <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-black text-danger">● LIVE</span>}
      </div>

      {wagers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Solo wagers</p>
          {wagers.map((w, i) => (
            <div key={`${w.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span>{w.flag}</span>
                <span className="truncate font-semibold">{w.name}</span>
                <span className="text-muted">staked ${w.stake}</span>
              </span>
              {w.profit == null ? (
                <span className="shrink-0 text-[11px] font-bold text-muted">⏳ in play</span>
              ) : (
                <span className={cn("num-bc shrink-0 font-bold", w.profit >= 0 ? "text-pitch" : "text-danger")}>
                  {w.profit >= 0 ? "won +" : "lost −"}${Math.abs(w.profit)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {duels.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Duels</p>
          {duels.map((d, i) => (
            <div key={`${d.aName}-${d.bName}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-semibold">{d.aFlag} {d.aName}</span>
                <span className="text-[11px] text-muted">vs</span>
                <span className="truncate font-semibold">{d.bFlag} {d.bName}</span>
                <span className="rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-bold text-muted">${d.stake} · {d.mode}</span>
              </span>
              {!d.settled ? (
                <span className="shrink-0 text-[11px] font-bold text-muted">⏳ in play</span>
              ) : d.winnerName ? (
                <span className="num-bc shrink-0 font-bold text-pitch">{d.winnerName} +${d.amount}</span>
              ) : (
                <span className="shrink-0 text-[11px] font-bold text-muted">push · money back</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

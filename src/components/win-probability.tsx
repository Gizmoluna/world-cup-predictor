import { asPercent, type WinProb } from "@/lib/odds";

// A compact Home / Draw / Away probability bar. Always labelled a model
// estimate — these are computed from form, not bookmaker prices.
export function WinProbability({
  prob,
  homeName,
  awayName,
}: {
  prob: WinProb;
  homeName: string;
  awayName: string;
}) {
  const pct = asPercent(prob);
  const lowConfidence = prob.confidence < 0.34;

  return (
    <div className="glass p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="title-bc text-sm text-[var(--accent)]">Win probability</h2>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          {lowConfidence ? "early estimate" : "form model"}
        </span>
      </div>

      <div className="flex h-8 overflow-hidden rounded-lg">
        <div className="flex items-center justify-center bg-pitch/70 text-[11px] font-black text-black" style={{ width: `${pct.home}%` }}>
          {pct.home >= 12 ? `${pct.home}%` : ""}
        </div>
        <div className="flex items-center justify-center bg-white/15 text-[11px] font-black" style={{ width: `${pct.draw}%` }}>
          {pct.draw >= 12 ? `${pct.draw}%` : ""}
        </div>
        <div className="flex items-center justify-center bg-[var(--accent)]/70 text-[11px] font-black text-black" style={{ width: `${pct.away}%` }}>
          {pct.away >= 12 ? `${pct.away}%` : ""}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 text-[11px] font-bold">
        <span className="truncate text-pitch">{homeName} {pct.home}%</span>
        <span className="text-center text-muted">Draw {pct.draw}%</span>
        <span className="truncate text-right text-[var(--accent)]">{pct.away}% {awayName}</span>
      </div>
    </div>
  );
}

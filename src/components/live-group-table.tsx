// Compact live group table, embedded inside the group predictors so you can see
// the current standings while you pick. Top 2 (advancing) are highlighted.
export interface LiveRow {
  teamId: string;
  name: string;
  flagUrl: string;
  played: number;
  goalDifference: number;
  points: number;
}

export function LiveGroupTable({ rows }: { rows: LiveRow[] }) {
  if (rows.length === 0 || rows.every((r) => r.played === 0)) {
    return (
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-[11px] text-muted">
        📊 Live table appears once these teams kick off.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg bg-surface-2">
      <div className="grid grid-cols-[18px_1fr_24px_28px_24px] items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-muted">
        <span>#</span>
        <span>Team</span>
        <span className="text-center">P</span>
        <span className="text-center">GD</span>
        <span className="text-center">Pts</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.teamId}
          className={`grid grid-cols-[18px_1fr_24px_28px_24px] items-center gap-1 px-2.5 py-1 text-xs ${
            i < 2 ? "bg-pitch/10" : ""
          }`}
        >
          <span className={`num-bc text-center ${i < 2 ? "text-pitch" : "text-muted"}`}>{i + 1}</span>
          <span className="flex min-w-0 items-center gap-1.5">
            {r.flagUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.flagUrl} alt="" loading="lazy" className="h-3.5 w-5 shrink-0 rounded object-cover" />
            ) : (
              <span className="h-3.5 w-5 shrink-0 rounded bg-white/10" />
            )}
            <span className="truncate font-semibold">{r.name}</span>
          </span>
          <span className="text-center tabular-nums text-muted">{r.played}</span>
          <span className="text-center tabular-nums text-muted">
            {r.goalDifference > 0 ? "+" : ""}
            {r.goalDifference}
          </span>
          <span className="num-bc text-center">{r.points}</span>
        </div>
      ))}
    </div>
  );
}

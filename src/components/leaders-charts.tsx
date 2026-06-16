import type { LeaderEntry } from "@/lib/types";

function Chart({
  title,
  unit,
  rows,
  accent,
}: {
  title: string;
  unit: string;
  rows: LeaderEntry[];
  accent: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="glass card-bc p-4">
      <h2 className="title-bc mb-3 text-sm text-[var(--accent)]">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted">
          No data yet — fills in once the goals start flying. ⚽
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <li key={r.playerId} className="flex items-center gap-2">
              <span className="num-bc w-5 text-center text-sm text-muted">{i + 1}</span>
              {r.teamFlagUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.teamFlagUrl} alt="" loading="lazy" className="h-4 w-6 shrink-0 rounded object-cover" />
              ) : (
                <span className="h-4 w-6 shrink-0 rounded bg-white/10" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">{r.name}</span>
                  <span className="num-bc shrink-0 text-sm" style={{ color: accent }}>
                    {r.value}
                    <span className="ml-0.5 text-[10px] text-muted">{unit}</span>
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(r.value / max) * 100}%`, background: accent }}
                  />
                </div>
                {r.teamName && <span className="text-[10px] text-muted">{r.teamName}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function LeadersCharts({
  scorers,
  assists,
}: {
  scorers: LeaderEntry[];
  assists: LeaderEntry[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Chart title="🥇 Golden Boot race · top scorers" unit="G" rows={scorers} accent="var(--gold, #ffd34d)" />
      <Chart title="🎯 Top assists" unit="A" rows={assists} accent="#2dd4bf" />
    </div>
  );
}

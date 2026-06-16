import { cn } from "@/lib/utils";

export interface PickRow {
  matchId: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  kickoff: string;
  status: "upcoming" | "live" | "full_time";
  predHome: number | null;
  predAway: number | null;
  scorerName: string | null;
  actual: string | null; // "2-1" when finished
  points: number | null;
  hidden: boolean; // upcoming pick on someone else's profile — concealed
}

function Flag({ url }: { url: string }) {
  if (!url) return <span className="inline-block h-3.5 w-5 rounded bg-white/10" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className="h-3.5 w-5 shrink-0 rounded object-cover" />;
}

export function PickHistory({ rows, emptyNote }: { rows: PickRow[]; emptyNote: string }) {
  if (rows.length === 0) {
    return <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">{emptyNote}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.matchId} className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <Flag url={r.homeFlag} />
            <span className="truncate font-semibold">{r.home}</span>
            <span className="text-muted">v</span>
            <span className="truncate font-semibold">{r.away}</span>
            <Flag url={r.awayFlag} />
          </div>
          {r.hidden ? (
            <span className="shrink-0 text-[11px] text-muted">🔒 hidden until kickoff</span>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <span className="num-bc text-base">
                {r.predHome ?? "–"}–{r.predAway ?? "–"}
              </span>
              {r.actual && (
                <span className="text-[11px] text-muted">act {r.actual}</span>
              )}
              {r.points != null && (
                <span
                  className={cn(
                    "num-bc rounded-md px-1.5 py-0.5 text-xs",
                    r.points > 0 ? "bg-pitch/20 text-pitch" : "bg-white/8 text-muted",
                  )}
                >
                  {r.points > 0 ? `+${r.points}` : "0"}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

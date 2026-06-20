import Link from "next/link";
import { cn } from "@/lib/utils";

export interface H2HRow {
  matchId: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  actual: string; // "2-1"
  myPred: string; // "2–1" or "—"
  myPts: number;
  oppPred: string;
  oppPts: number;
  winner: "me" | "opp" | "draw";
}

export interface H2HPlayer {
  name: string;
  flag: string;
}

function Flag({ url }: { url: string }) {
  if (!url) return <span className="inline-block h-3 w-4 rounded bg-white/10" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className="h-3 w-4 shrink-0 rounded object-cover" />;
}

// The match-by-match duel between two players: every finished game both
// predicted, side by side, with who took the points — plus the running series.
export function HeadToHead({
  me,
  opp,
  rows,
  tally,
}: {
  me: H2HPlayer;
  opp: H2HPlayer;
  rows: H2HRow[];
  tally: { myWins: number; oppWins: number; draws: number; myPoints: number; oppPoints: number };
}) {
  const lead =
    tally.myWins > tally.oppWins ? "me" : tally.oppWins > tally.myWins ? "opp" : "level";
  const leadText =
    lead === "me"
      ? `You lead ${tally.myWins}–${tally.oppWins}`
      : lead === "opp"
        ? `${opp.name} leads ${tally.oppWins}–${tally.myWins}`
        : `All square ${tally.myWins}–${tally.oppWins}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Series header */}
      <div className="glass card-bc overflow-hidden p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className={cn("flex flex-col items-center gap-1 text-center", lead === "opp" && "opacity-60")}>
            <span className="text-3xl">{me.flag}</span>
            <span className="text-sm font-black">You</span>
          </div>
          <div className="text-center">
            <div className="num-bc text-4xl font-black tabular-nums">
              <span className={lead === "me" ? "text-pitch" : ""}>{tally.myWins}</span>
              <span className="mx-1.5 text-muted">–</span>
              <span className={lead === "opp" ? "text-pitch" : ""}>{tally.oppWins}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted">matches won</div>
          </div>
          <div className={cn("flex flex-col items-center gap-1 text-center", lead === "me" && "opacity-60")}>
            <span className="text-3xl">{opp.flag}</span>
            <span className="text-sm font-black">{opp.name}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-black",
              lead === "level" ? "bg-white/10 text-muted" : "bg-pitch/20 text-pitch",
            )}
          >
            {tally.draws > 0 ? `${leadText} · ${tally.draws} drawn` : leadText}
          </span>
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">
          Points across these matches · {tally.myPoints} (you) vs {tally.oppPoints} ({opp.name})
        </p>
      </div>

      {/* Match-by-match */}
      {rows.length === 0 ? (
        <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">
          No head-to-head yet — once you&apos;ve both predicted a finished match it shows here.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <Link
              key={r.matchId}
              href={`/matches/${r.matchId}`}
              className="glass flex flex-col gap-2 p-3 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                <Flag url={r.homeFlag} />
                <span className="truncate">{r.home}</span>
                <span className="num-bc px-1 text-muted">{r.actual}</span>
                <span className="truncate">{r.away}</span>
                <Flag url={r.awayFlag} />
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                <div className={cn("flex items-center justify-end gap-2", r.winner === "me" && "font-black")}>
                  <span className="num-bc">{r.myPred}</span>
                  <span className={cn("num-bc rounded-md px-1.5 py-0.5 text-xs", r.myPts > 0 ? "bg-pitch/20 text-pitch" : "bg-white/8 text-muted")}>
                    +{r.myPts}
                  </span>
                </div>
                <span className="text-[11px] font-black text-muted">
                  {r.winner === "me" ? "◀ you" : r.winner === "opp" ? `${opp.name} ▶` : "tie"}
                </span>
                <div className={cn("flex items-center gap-2", r.winner === "opp" && "font-black")}>
                  <span className={cn("num-bc rounded-md px-1.5 py-0.5 text-xs", r.oppPts > 0 ? "bg-pitch/20 text-pitch" : "bg-white/8 text-muted")}>
                    +{r.oppPts}
                  </span>
                  <span className="num-bc">{r.oppPred}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

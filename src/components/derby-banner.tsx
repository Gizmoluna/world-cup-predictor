import type { MatchStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface DerbyView {
  homeUserId: string;
  homeName: string;
  homeUserFlag: string;
  homeTeam: string;
  homeTeamFlag: string;
  awayUserId: string;
  awayName: string;
  awayUserFlag: string;
  awayTeam: string;
  awayTeamFlag: string;
}

function Flag({ url, fallback }: { url: string; fallback: string }) {
  if (!url) return <span className="text-xl">{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-5 w-7 rounded object-cover shadow" />;
}

// Big, loud treatment for a match where two friends' countries collide.
// Pre-match: hype. Live: tension. Finished: bragging rights, with a callout if
// the viewer's side won.
export function DerbyBanner({
  derbies,
  status,
  winnerSide,
  viewerId,
}: {
  derbies: DerbyView[];
  status: MatchStatus;
  winnerSide: "home" | "away" | "draw" | null;
  viewerId: string;
}) {
  if (derbies.length === 0) return null;
  const finished = status === "full_time";
  const live = status === "live";

  return (
    <div className="relative mb-4 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 via-surface to-danger/15 p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="title-bc text-base text-gold">🔥 Homeland Derby</span>
        {live && <span className="rounded-full bg-danger/25 px-2 py-0.5 text-[10px] font-black text-danger">● LIVE — bragging rights up for grabs</span>}
        {!finished && !live && <span className="text-[10px] font-bold uppercase tracking-wide text-muted">bragging rights on the line</span>}
        {finished && <span className="text-[10px] font-bold uppercase tracking-wide text-muted">settled</span>}
      </div>

      <div className="flex flex-col gap-2.5">
        {derbies.map((d) => {
          const homeWon = finished && winnerSide === "home";
          const awayWon = finished && winnerSide === "away";
          const draw = finished && winnerSide === "draw";
          const winnerName = homeWon ? d.homeName : awayWon ? d.awayName : null;
          const winnerIsViewer =
            (homeWon && d.homeUserId === viewerId) || (awayWon && d.awayUserId === viewerId);
          const loserIsViewer =
            (homeWon && d.awayUserId === viewerId) || (awayWon && d.homeUserId === viewerId);

          return (
            <div key={`${d.homeUserId}-${d.awayUserId}`} className="rounded-xl bg-black/20 p-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className={cn("flex flex-col items-center gap-1 text-center", awayWon && "opacity-50")}>
                  <Flag url={d.homeTeamFlag} fallback={d.homeUserFlag} />
                  <span className="text-sm font-black">{d.homeName}</span>
                  <span className="text-[11px] text-muted">{d.homeTeam}</span>
                  {homeWon && <span className="text-base">🏆</span>}
                </div>
                <span className="text-lg font-black text-gold">🆚</span>
                <div className={cn("flex flex-col items-center gap-1 text-center", homeWon && "opacity-50")}>
                  <Flag url={d.awayTeamFlag} fallback={d.awayUserFlag} />
                  <span className="text-sm font-black">{d.awayName}</span>
                  <span className="text-[11px] text-muted">{d.awayTeam}</span>
                  {awayWon && <span className="text-base">🏆</span>}
                </div>
              </div>

              <p className="mt-2 text-center text-xs font-semibold">
                {!finished ? (
                  <span className="text-muted">
                    {d.homeName} ({d.homeTeam}) vs {d.awayName} ({d.awayTeam}) — winner takes the bragging rights.
                  </span>
                ) : draw ? (
                  <span className="text-muted">🤝 Honours even — {d.homeName} &amp; {d.awayName} share the spoils.</span>
                ) : winnerIsViewer ? (
                  <span className="text-pitch">🎉 You did it — bragging rights are YOURS over {homeWon ? d.awayName : d.homeName}!</span>
                ) : loserIsViewer ? (
                  <span className="text-danger">😤 {winnerName} got you this time. Rematch incoming.</span>
                ) : (
                  <span className="text-gold">🏆 {winnerName} takes the bragging rights.</span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

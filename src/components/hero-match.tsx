import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import { TeamFlag } from "./team-flag";
import { Countdown } from "./countdown";
import { melbourne } from "@/lib/time";
import { cn } from "@/lib/utils";

const STAGE: Record<string, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  third_place: "Third place",
  final: "FINAL",
};

export function HeroMatch({
  match,
  home,
  away,
  predicted,
}: {
  match: Match;
  home?: Team;
  away?: Team;
  predicted: boolean;
}) {
  const live = match.status === "live";
  const finished = match.status === "full_time";

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "relative block overflow-hidden rounded-3xl border border-border p-5 transition active:scale-[0.99]",
        "bg-[radial-gradient(120%_120%_at_50%_-20%,var(--accent-soft),transparent_60%)]",
        live && "ring-1 ring-danger/50",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="title-bc text-xs tracking-[0.16em] text-[var(--accent)]">
            {live ? "● LIVE NOW" : finished ? "FULL-TIME" : "NEXT UP"} · {STAGE[match.stage] ?? "Match"}
          </span>
          {!live && !finished && (
            <span className="num-bc rounded-full bg-black/40 px-2.5 py-0.5 text-xs text-[var(--accent)]">
              <Countdown kickoffAt={match.kickoffAt} />
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamFlag team={home} size={56} className="shadow-lg ring-1 ring-white/15" />
            <span className="title-bc text-center text-sm">{home?.shortName ?? home?.name ?? "TBD"}</span>
          </div>

          <div className="flex flex-col items-center px-2">
            {live || finished ? (
              <div className="num-bc text-4xl">
                {match.homeScore}<span className="mx-1 text-muted">:</span>{match.awayScore}
              </div>
            ) : (
              <>
                <div className="num-bc text-3xl text-gold drop-shadow-[0_0_10px_rgba(255,211,77,0.6)]">VS</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted">
                  {melbourne(match.kickoffAt, "EEE h:mm a")}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            <TeamFlag team={away} size={56} className="shadow-lg ring-1 ring-white/15" />
            <span className="title-bc text-center text-sm">{away?.shortName ?? away?.name ?? "TBD"}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <span
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide",
              finished
                ? "bg-white/10 text-muted"
                : predicted
                  ? "bg-pitch/20 text-pitch"
                  : "bg-[var(--accent)] text-black",
            )}
          >
            {finished ? "See how you did" : predicted ? "✓ Prediction locked — tap to view" : "⚡ Make your pick"}
          </span>
        </div>
      </div>
    </Link>
  );
}

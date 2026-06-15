import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Match, Team } from "@/lib/types";
import { TeamFlag } from "./team-flag";
import { Countdown } from "./countdown";
import { melbourne } from "@/lib/time";
import { cn } from "@/lib/utils";

export interface Predictor {
  id: string;
  flag: string;
  name: string;
  did: boolean;
}

const STAGE_LABEL: Record<string, string> = {
  group: "Group",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-final",
  semi_final: "Semi-final",
  third_place: "3rd place",
  final: "FINAL",
};

export function MatchCard({
  match,
  home,
  away,
  predictors = [],
  needsPrediction = false,
}: {
  match: Match;
  home?: Team;
  away?: Team;
  predictors?: Predictor[];
  needsPrediction?: boolean;
}) {
  const live = match.status === "live";
  const finished = match.status === "full_time";
  const stage = STAGE_LABEL[match.stage] ?? match.stage;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "scorebug card-bc block p-3.5 transition active:scale-[0.99]",
        live && "ring-1 ring-danger/50",
        needsPrediction && "ring-1 ring-[var(--accent)]/50",
      )}
    >
      {/* top strip */}
      <div className="mb-2.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        <span className="title-bc text-[11px] tracking-[0.12em]">
          {stage}
          {match.groupName ? ` · ${match.groupName}` : ""}
        </span>
        {live ? (
          <span className="flex items-center gap-1 rounded-full bg-danger/20 px-2 py-0.5 text-danger">
            <span className="h-1.5 w-1.5 animate-live rounded-full bg-danger" /> LIVE
          </span>
        ) : finished ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5">Full-time</span>
        ) : (
          <span className="text-[var(--accent)]">
            <Countdown kickoffAt={match.kickoffAt} />
          </span>
        )}
      </div>

      {/* scoreline */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <TeamFlag team={home} size={34} className="shadow-md ring-1 ring-white/10" />
          <span className="truncate text-[15px] font-extrabold">{home?.name ?? "TBD"}</span>
        </div>

        <div className="px-2 text-center">
          {live || finished ? (
            <div className="num-bc text-3xl leading-none">
              {match.homeScore}<span className="mx-1.5 text-muted">:</span>{match.awayScore}
            </div>
          ) : (
            <div className="num-bc rounded-lg bg-black/30 px-2.5 py-1 text-sm text-muted">
              {melbourne(match.kickoffAt, "h:mm a")}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2.5 min-w-0">
          <span className="truncate text-right text-[15px] font-extrabold">{away?.name ?? "TBD"}</span>
          <TeamFlag team={away} size={34} className="shadow-md ring-1 ring-white/10" />
        </div>
      </div>

      {/* bottom strip */}
      <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted">
        <span className="flex items-center gap-1 truncate">
          <MapPin size={11} /> {match.venue ?? "Venue TBC"}
        </span>
        <span className="flex items-center gap-1.5">
          {predictors.map((p) => (
            <span
              key={p.id}
              className={cn(
                "rounded-full px-1.5 py-0.5 font-bold",
                p.did ? "bg-pitch/20 text-pitch" : "bg-white/5 text-muted",
              )}
              title={`${p.name}: ${p.did ? "predicted" : "no prediction"}`}
            >
              {p.flag} {p.did ? "✓" : "—"}
            </span>
          ))}
        </span>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Match, Team } from "@/lib/types";
import { TeamFlag } from "./team-flag";
import { Badge } from "./ui/badge";
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
        "glass block p-4 transition active:scale-[0.99]",
        live && "ring-1 ring-danger/40",
        needsPrediction && "ring-1 ring-[var(--accent)]/50",
      )}
    >
      <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-muted">
        <span>
          {stage}
          {match.groupName ? ` ${match.groupName}` : ""}
        </span>
        {live && <Badge tone="live">● Live</Badge>}
        {finished && <Badge>Full-time</Badge>}
        {!live && !finished && (
          <span className="text-[var(--accent)]">
            <Countdown kickoffAt={match.kickoffAt} />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <TeamFlag team={home} size={30} />
          <span className="truncate font-bold">{home?.name ?? "TBD"}</span>
        </div>

        <div className="px-2 text-center">
          {live || finished ? (
            <div className="text-2xl font-black tabular-nums">
              {match.homeScore}<span className="mx-1 text-muted">–</span>{match.awayScore}
            </div>
          ) : (
            <div className="text-sm font-bold text-muted">{melbourne(match.kickoffAt, "h:mm a")}</div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <span className="truncate text-right font-bold">{away?.name ?? "TBD"}</span>
          <TeamFlag team={away} size={30} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span className="flex items-center gap-1 truncate">
          <MapPin size={12} /> {match.venue ?? "Venue TBC"}
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

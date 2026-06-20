import Link from "next/link";
import type { Standing, Team } from "@/lib/types";
import { TeamFlag } from "./team-flag";
import { cn } from "@/lib/utils";

export function StandingsView({
  groups,
  teamById,
  favouriteTeamId,
}: {
  groups: { name: string; rows: Standing[] }[];
  teamById: Record<string, Team>;
  favouriteTeamId: string | null;
}) {
  if (groups.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">No group data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.name} className="glass overflow-hidden p-0">
          <div className="flex items-center justify-between bg-[var(--accent)]/10 px-4 py-2.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--accent)]">{g.name}</h2>
            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wide text-muted">
              <span className="w-5 text-center">P</span>
              <span className="w-5 text-center">GD</span>
              <span className="w-6 text-center">Pts</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {g.rows.map((r, i) => {
              const team = teamById[r.teamId];
              const mine = r.teamId === favouriteTeamId;
              const qualifies = i < 2;
              return (
                <Link
                  key={r.teamId}
                  href={`/teams/${r.teamId}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm transition active:scale-[0.99]",
                    qualifies && "border-l-2 border-pitch",
                    mine && "bg-[var(--accent-soft)]",
                  )}
                >
                  <span className={cn("w-5 text-center text-xs font-black", qualifies ? "text-pitch" : "text-muted")}>
                    {i + 1}
                  </span>
                  <TeamFlag team={team} size={24} />
                  <span className={cn("flex-1 truncate font-semibold", mine && "text-[var(--accent)]")}>
                    {team?.name ?? r.teamId}
                    {mine && " ★"}
                  </span>
                  <span className="w-5 text-center tabular-nums text-muted">{r.played}</span>
                  <span className="w-5 text-center tabular-nums text-muted">
                    {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                  </span>
                  <span className="w-6 text-center text-base font-black tabular-nums">{r.points}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-center text-[11px] text-muted">
        <span className="text-pitch">▎</span> top 2 advance · <span className="text-[var(--accent)]">★</span> your team
      </p>
    </div>
  );
}

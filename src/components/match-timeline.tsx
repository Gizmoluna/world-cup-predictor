import type { MatchEvent, Player, Team } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON: Record<string, string> = {
  goal: "⚽",
  penalty_goal: "⚽",
  own_goal: "🥅",
  penalty_missed: "❌",
  yellow_card: "🟨",
  red_card: "🟥",
  substitution: "🔁",
  var: "📺",
};

export function MatchTimeline({
  events,
  playerById,
  teamById,
  homeId,
}: {
  events: MatchEvent[];
  playerById: Record<string, Player>;
  teamById: Record<string, Team>;
  homeId: string;
}) {
  const sorted = [...events].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
  return (
    <div className="glass divide-y divide-border p-0">
      {sorted.map((e) => {
        const isHome = e.teamId === homeId;
        const player = e.playerId ? playerById[e.playerId] : undefined;
        const team = e.teamId ? teamById[e.teamId] : undefined;
        return (
          <div
            key={e.id}
            className={cn("flex items-center gap-3 px-4 py-2.5 text-sm", !isHome && "flex-row-reverse text-right")}
          >
            <span className="w-9 shrink-0 font-bold tabular-nums text-muted">{e.minute ?? "—"}&apos;</span>
            <span className="text-lg">{ICON[e.type] ?? "•"}</span>
            <span className="flex-1 truncate">
              <span className="font-bold">{player?.name ?? team?.shortName ?? ""}</span>
              {e.type === "var" && <span className="text-muted"> · VAR</span>}
              {e.description === "player_of_match" && <span className="text-gold"> · MOTM</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

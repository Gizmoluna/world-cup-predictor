import { cn } from "@/lib/utils";
import type { Team } from "@/lib/types";

export function TeamFlag({
  team,
  size = 28,
  className,
}: {
  team?: Team;
  size?: number;
  className?: string;
}) {
  if (!team || !team.flagUrl) {
    return (
      <span
        className={cn("inline-flex items-center justify-center rounded bg-white/10 text-[10px] font-bold text-muted", className)}
        style={{ width: size, height: size * 0.7 }}
      >
        {team?.shortName?.slice(0, 3) ?? ""}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.flagUrl}
      alt={team.name}
      width={size}
      height={size * 0.7}
      className={cn("inline-block rounded object-cover shadow", className)}
      style={{ width: size, height: size * 0.7 }}
    />
  );
}

export function TeamLine({
  team,
  size = 26,
  className,
  reverse = false,
}: {
  team?: Team;
  size?: number;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0", reverse && "flex-row-reverse", className)}>
      <TeamFlag team={team} size={size} />
      <span className="truncate font-semibold">{team?.name ?? "TBD"}</span>
    </div>
  );
}

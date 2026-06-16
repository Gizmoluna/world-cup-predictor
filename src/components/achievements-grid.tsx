import type { Achievement } from "@/lib/achievements";
import { nextAchievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  const earned = achievements.filter((a) => a.earned).length;
  const next = nextAchievement(achievements);

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">
        {earned}/{achievements.length} unlocked
      </p>

      {/* Closest-to-unlock nudge — gives collectors a target. */}
      {next && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--accent-soft)] p-2.5">
          <span className="text-xl">{next.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">
              Next: {next.name}
              <span className="ml-1 font-normal text-muted">
                · {next.remaining} to go
              </span>
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.round(next.progress * 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.desc}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl p-3 text-center",
              a.earned ? "bg-[var(--accent-soft)]" : "bg-surface-2",
            )}
          >
            <span className={cn("text-2xl", !a.earned && "opacity-50 grayscale")}>{a.icon}</span>
            <span className={cn("text-[10px] font-bold leading-tight", !a.earned && "text-muted")}>{a.name}</span>
            {a.earned ? (
              <span className="text-[9px] font-bold uppercase tracking-wide text-pitch">unlocked</span>
            ) : (
              <span className="text-[9px] tabular-nums text-muted">
                {a.current}/{a.target}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import type { Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  const earned = achievements.filter((a) => a.earned).length;
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">
        {earned}/{achievements.length} unlocked
      </p>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.desc}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl p-3 text-center",
              a.earned ? "bg-[var(--accent-soft)]" : "bg-surface-2 opacity-50 grayscale",
            )}
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="text-[10px] font-bold leading-tight">{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

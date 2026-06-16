import { rankProgress } from "@/lib/constants";

export function LevelBar({ points }: { points: number }) {
  const r = rankProgress(points);
  return (
    <div className="glass card-bc p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="title-bc text-sm">
          {r.icon} Lvl {r.level} · {r.title}
        </span>
        <span className="num-bc text-lg text-[var(--accent)]">{points} XP</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all"
          style={{ width: `${Math.round(r.progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted">
        {r.nextTitle ? `${r.toNext} XP to ${r.nextTitle}` : "Max rank — you're the GOAT 🐐"}
      </p>
    </div>
  );
}

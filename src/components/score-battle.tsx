import type { LeaderboardRow } from "@/lib/aggregate";
import { chrome } from "@/lib/display";
import { cn } from "@/lib/utils";

export function ScoreBattle({
  rows,
  subtitle,
}: {
  rows: LeaderboardRow[];
  subtitle?: string;
}) {
  const top = [...rows].sort((a, b) => b.points - a.points);
  const a = top[0];
  const b = top[1];
  if (!a) {
    return <div className="glass p-6 text-center text-sm text-muted">No players in this league yet.</div>;
  }
  const ca = chrome(a.user);
  const cb = b ? chrome(b.user) : null;
  const leader = !b || a.points === b.points ? null : a.points > b.points ? ca.id : cb!.id;

  return (
    <div className="glass card-bc overflow-hidden p-0">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        <Side
          name={ca.name}
          flag={ca.flag}
          accent={ca.gradient}
          points={a.points}
          leading={leader === ca.id}
          align="left"
        />
        <div className="relative flex flex-col items-center justify-center px-3">
          <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-[var(--accent)]/40 to-transparent" />
          <div className="num-bc text-2xl text-gold drop-shadow-[0_0_12px_rgba(255,211,77,0.7)]">VS</div>
          <div className="mt-1 text-lg">🏆</div>
        </div>
        {cb ? (
          <Side
            name={cb.name}
            flag={cb.flag}
            accent={cb.gradient}
            points={b!.points}
            leading={leader === cb.id}
            align="right"
          />
        ) : (
          <div className="flex items-center justify-end px-4 py-6 text-right text-xs text-muted">Invite a rival →</div>
        )}
      </div>
      <div className="relative overflow-hidden border-t border-border bg-black/30 py-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
        <span className="title-bc text-[var(--accent)]">
          {subtitle ??
            (leader ? `${leader === ca.id ? ca.name : cb!.name} leads` : "Dead level — it's on")}
        </span>
      </div>
    </div>
  );
}

function Side({
  name,
  flag,
  accent,
  points,
  leading,
  align,
}: {
  name: string;
  flag: string;
  accent: string;
  points: number;
  leading: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 px-4 py-6",
        align === "right" ? "items-end text-right" : "items-start text-left",
        leading && "animate-pulse-glow",
      )}
    >
      <div className="h-1.5 w-14 rounded-full" style={{ background: accent }} />
      <div className="flex items-center gap-1.5">
        <span className="text-xl">{flag}</span>
        <span className="title-bc text-base">{name}</span>
        {leading && <span title="Leading">👑</span>}
      </div>
      <div className="num-bc text-5xl leading-none">{points}</div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">points</div>
    </div>
  );
}

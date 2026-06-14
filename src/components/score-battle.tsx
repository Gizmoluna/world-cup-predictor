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
    return (
      <div className="glass p-6 text-center text-sm text-muted">No players in this league yet.</div>
    );
  }
  const ca = chrome(a.user);
  const cb = b ? chrome(b.user) : null;
  const leader = !b || a.points === b.points ? null : a.points > b.points ? ca.id : cb!.id;

  return (
    <div className="glass overflow-hidden p-0">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <Side
          name={ca.name}
          flag={ca.flag}
          gradient={ca.gradient}
          points={a.points}
          leading={leader === ca.id}
          align="left"
        />
        <div className="flex flex-col items-center px-2 py-6">
          <div className="text-3xl drop-shadow-[0_0_14px_rgba(255,211,77,0.6)]">🏆</div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-gold">vs</div>
        </div>
        {cb ? (
          <Side
            name={cb.name}
            flag={cb.flag}
            gradient={cb.gradient}
            points={b!.points}
            leading={leader === cb.id}
            align="right"
          />
        ) : (
          <div className="px-4 py-6 text-right text-xs text-muted">Invite a rival →</div>
        )}
      </div>
      <div className="border-t border-border bg-black/20 py-2 text-center text-[11px] font-bold uppercase tracking-widest text-muted">
        {subtitle ??
          (leader
            ? `${leader === ca.id ? ca.name : cb!.name} leads the clash`
            : "Dead level — it's on")}
      </div>
    </div>
  );
}

function Side({
  name,
  flag,
  gradient,
  points,
  leading,
  align,
}: {
  name: string;
  flag: string;
  gradient: string;
  points: number;
  leading: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-4 py-6",
        align === "right" ? "items-end text-right" : "items-start text-left",
        leading && "animate-pulse-glow",
      )}
    >
      <div className="h-1 w-12 rounded-full" style={{ background: gradient }} />
      <div className="flex items-center gap-1.5 text-sm font-extrabold">
        <span>{flag}</span>
        <span>{name}</span>
        {leading && <span title="Leading">👑</span>}
      </div>
      <div className="text-4xl font-black tabular-nums">{points}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted">points</div>
    </div>
  );
}

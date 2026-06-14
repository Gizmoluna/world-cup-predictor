import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "live" | "win" | "loss" | "warning";

const tones: Record<Tone, string> = {
  default: "bg-white/10 text-muted",
  accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
  live: "bg-danger/20 text-danger animate-pulse-glow",
  win: "bg-pitch/20 text-pitch",
  loss: "bg-danger/20 text-danger",
  warning: "bg-gold/20 text-gold",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

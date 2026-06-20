import Link from "next/link";
import { cn } from "@/lib/utils";

// A small pill bar that interlinks the tournament-info cluster (Insights,
// Standings, Leaderboard) so each is one tap from the others.
const LINKS = [
  { href: "/insights", label: "📊 Insights" },
  { href: "/standings", label: "📋 Standings" },
  { href: "/leaderboard", label: "🏆 Leaderboard" },
];

export function SectionNav({ active }: { active: string }) {
  return (
    <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95",
            l.href === active ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted",
          )}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

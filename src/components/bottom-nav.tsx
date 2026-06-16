"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Coins, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Five motivation-based tabs: get going (Home), predict (Matches), wager (Bets),
// climb (Table), and your identity/badges (Me). Leagues + Chat live in the
// header so the bar stays uncluttered.
const ITEMS = [
  { href: "/dashboard", label: "Home", Icon: Home, match: ["/dashboard"] },
  { href: "/matches", label: "Matches", Icon: CalendarDays, match: ["/matches"] },
  { href: "/duels", label: "Bets", Icon: Coins, match: ["/duels"] },
  { href: "/leaderboard", label: "Table", Icon: Trophy, match: ["/leaderboard", "/battle", "/stats"] },
  { href: "/me", label: "Me", Icon: User, match: ["/me", "/profile"] },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold uppercase tracking-wide transition",
                active ? "text-[var(--accent)]" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition",
                  active && "bg-[var(--accent-soft)]",
                )}
              >
                <Icon size={20} className={active ? "drop-shadow-[0_0_8px_var(--accent)]" : ""} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

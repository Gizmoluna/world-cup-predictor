"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Swords, Trophy, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/matches", label: "Matches", Icon: CalendarDays },
  { href: "/battle", label: "Battle", Icon: Swords },
  { href: "/leaderboard", label: "Table", Icon: Trophy },
  { href: "/news", label: "News", Icon: Newspaper },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-xl items-stretch justify-around">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition",
                active ? "text-[var(--accent)]" : "text-muted",
              )}
            >
              <Icon size={22} className={active ? "drop-shadow-[0_0_8px_var(--accent)]" : ""} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

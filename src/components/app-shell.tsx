import Link from "next/link";
import { Settings } from "lucide-react";
import { getCurrentUser, getActiveLeague } from "@/lib/session";
import { getUserLeagues } from "@/lib/leagues";
import { ThemeApplier } from "./theme-applier";
import { BottomNav } from "./bottom-nav";
import { LeagueSwitcher } from "./league-switcher";
import { APP_NAME } from "@/lib/constants";
import { chrome } from "@/lib/display";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const c = user ? chrome(user) : null;
  const [active, leagues] = user
    ? await Promise.all([getActiveLeague(user.id), getUserLeagues(user.id)])
    : [null, []];

  return (
    <div className="pitch-lines relative mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <ThemeApplier theme={user?.theme ?? "carina"} />

      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="text-sm font-extrabold tracking-tight">
              {APP_NAME}
              <span className="text-[var(--accent)]"> · Clash</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user && c && (
              <Link href={`/profile/${user.id}`} className="flex items-center gap-1.5 text-sm font-bold">
                <span>{c.flag}</span>
                <span className="text-[var(--accent)]">{user.name}</span>
              </Link>
            )}
            <Link href="/settings" className="text-muted hover:text-foreground">
              <Settings size={20} />
            </Link>
          </div>
        </div>
        {user && active && (
          <div className="border-t border-border/60 px-4 py-1.5">
            <LeagueSwitcher
              active={{ id: active.id, name: active.name }}
              leagues={leagues.map((l) => ({ id: l.id, name: l.name }))}
            />
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1 px-4 pb-28 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}

import Link from "next/link";
import { Settings, MessageCircle, Users } from "lucide-react";
import { getCurrentUser, getActiveLeague } from "@/lib/session";
import { getUserLeagues } from "@/lib/leagues";
import { ThemeApplier } from "./theme-applier";
import { BottomNav } from "./bottom-nav";
import { LeagueSwitcher } from "./league-switcher";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
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
            <span className="title-bc text-base tracking-[0.04em]">
              World Cup <span className="text-gradient">Predictor</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <Link href="/leagues" className="text-muted hover:text-foreground" aria-label="Leagues">
                  <Users size={20} />
                </Link>
                <Link href="/chat" className="text-muted hover:text-foreground" aria-label="League chat">
                  <MessageCircle size={20} />
                </Link>
              </>
            )}
            <Link href="/settings" className="text-muted hover:text-foreground" aria-label="Settings">
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

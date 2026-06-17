import Link from "next/link";
import { Settings, MessageCircle, Users, UserPlus } from "lucide-react";
import { getCurrentUser, getActiveLeague } from "@/lib/session";
import { getUserLeagues } from "@/lib/leagues";
import { getIncomingRequests } from "@/lib/friends";
import { getUser } from "@/lib/data";
import { chrome } from "@/lib/display";
import { ThemeApplier } from "./theme-applier";
import { BottomNav } from "./bottom-nav";
import { LeagueSwitcher } from "./league-switcher";
import { InviteModal } from "./invite-modal";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const [active, leagues, incomingIds] = user
    ? await Promise.all([
        getActiveLeague(user.id),
        getUserLeagues(user.id),
        getIncomingRequests(user.id),
      ])
    : [null, [], []];

  const incoming = (await Promise.all(incomingIds.map((id) => getUser(id))))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => ({ id: u.id, name: u.name, flag: chrome(u).flag }));

  return (
    <div className="pitch-lines relative mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <ThemeApplier theme={user?.theme ?? "carina"} />
      {user && incoming.length > 0 && <InviteModal requests={incoming} />}

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
                <Link href="/friends" className="relative text-muted hover:text-foreground" aria-label="Friends">
                  <UserPlus size={20} />
                  {incoming.length > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-black text-black">
                      {incoming.length}
                    </span>
                  )}
                </Link>
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

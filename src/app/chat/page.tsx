import Link from "next/link";
import { requireUser, getActiveLeague } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { ChatRoom } from "@/components/chat-room";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);

  if (!league) {
    return (
      <AppShell>
        <h1 className="mb-2 text-2xl font-black">Trash Talk 💬</h1>
        <Link href="/leagues" className="glass block p-4 ring-1 ring-[var(--accent)]/50">
          <p className="text-sm font-bold">Join a league to start chatting</p>
          <p className="mt-1 text-xs text-muted">
            Chat is per league. <span className="text-[var(--accent)]">Go to Leagues →</span>
          </p>
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-3">
        <h1 className="text-2xl font-black">Trash Talk 💬</h1>
        <p className="text-sm text-muted">{league.name}</p>
      </div>
      <ChatRoom leagueId={league.id} currentUserId={user.id} />
    </AppShell>
  );
}

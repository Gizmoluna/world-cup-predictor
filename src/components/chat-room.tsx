"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { fetchMessages, sendMessage, type ChatLine } from "@/app/actions";
import { melbourneTime } from "@/lib/time";
import { cn } from "@/lib/utils";

export function ChatRoom({
  leagueId,
  currentUserId,
}: {
  leagueId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);

  async function refresh() {
    const res = await fetchMessages(leagueId);
    if (res.ok) {
      setMessages(res.messages);
      setLoaded(true);
    }
  }

  // Poll every 4s for live trash talk during matches.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  // Auto-scroll when new messages arrive.
  useEffect(() => {
    const newest = messages[messages.length - 1]?.id ?? null;
    if (newest !== lastId.current) {
      lastId.current = newest;
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    start(async () => {
      await sendMessage(leagueId, body);
      await refresh();
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex min-h-[50dvh] flex-col gap-2 pb-28">
        {!loaded ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No messages yet — start the trash talk. 🔥
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.userId === currentUserId;
            return (
              <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {!mine && (
                  <span className="mb-0.5 px-1 text-[11px] font-bold text-muted">
                    {m.flag} {m.name}
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-[var(--accent)] text-black"
                      : "rounded-bl-md bg-surface-2 text-foreground",
                  )}
                >
                  {m.body}
                </div>
                <span className="mt-0.5 px-1 text-[10px] text-muted">{melbourneTime(m.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* sticky composer above the bottom nav */}
      <div className="fixed inset-x-0 bottom-[64px] z-40 mx-auto max-w-xl border-t border-border bg-surface/90 px-4 py-2 backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Talk your talk…"
            maxLength={500}
            className="h-11 flex-1 rounded-full border border-border bg-surface-2 px-4 text-base outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={send}
            disabled={pending || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-black active:scale-90 disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

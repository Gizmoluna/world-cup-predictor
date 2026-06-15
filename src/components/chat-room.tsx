"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send, Smile, ImagePlus } from "lucide-react";
import { fetchMessages, sendMessage, type ChatLine } from "@/app/actions";
import { GifPicker } from "./gif-picker";
import { melbourneTime } from "@/lib/time";
import { cn } from "@/lib/utils";

const EMOJIS = ["⚽", "🔥", "😂", "😭", "🐐", "🏆", "💀", "👏", "😱", "🙌", "🤡", "💪", "🇨🇴", "🍀", "❤️", "🤝"];

function isImageUrl(s: string): boolean {
  const t = s.trim();
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?\S*)?$/i.test(t) || /(giphy\.com\/media|media\.tenor\.com)\/\S+/i.test(t);
}

export function ChatRoom({ leagueId, currentUserId }: { leagueId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastId = useRef<string | null>(null);

  async function refresh() {
    const res = await fetchMessages(leagueId);
    if (res.ok) {
      setMessages(res.messages);
      setLoaded(true);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  useEffect(() => {
    const newest = messages[messages.length - 1]?.id ?? null;
    if (newest !== lastId.current) {
      lastId.current = newest;
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function send(body?: string) {
    const msg = (body ?? text).trim();
    if (!msg) return;
    if (!body) setText("");
    start(async () => {
      await sendMessage(leagueId, msg);
      await refresh();
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok && data.url) send(data.url);
      else alert(data.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex min-h-[50dvh] flex-col gap-2 pb-40">
        {!loaded ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No messages yet — start the trash talk. 🔥</p>
        ) : (
          messages.map((m) => {
            const mine = m.userId === currentUserId;
            const img = isImageUrl(m.body);
            return (
              <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                {!mine && <span className="mb-0.5 px-1 text-[11px] font-bold text-muted">{m.flag} {m.name}</span>}
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.body}
                    alt=""
                    loading="lazy"
                    className="max-h-56 max-w-[80%] rounded-2xl border border-border object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm break-words",
                      mine ? "rounded-br-md bg-[var(--accent)] text-black" : "rounded-bl-md bg-surface-2 text-foreground",
                    )}
                  >
                    {m.body}
                  </div>
                )}
                <span className="mt-0.5 px-1 text-[10px] text-muted">{melbourneTime(m.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-[64px] z-40 mx-auto max-w-xl border-t border-border bg-surface/95 px-4 py-2 backdrop-blur-xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {showGif && (
          <GifPicker
            onSelect={(url) => { setShowGif(false); send(url); }}
            onClose={() => setShowGif(false)}
          />
        )}
        {showEmoji && (
          <div className="no-scrollbar mb-2 flex gap-1 overflow-x-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setText((t) => t + e)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg active:scale-90"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowEmoji((s) => !s); setShowGif(false); }} className="shrink-0 text-muted active:scale-90" aria-label="Emojis">
            <Smile size={22} className={showEmoji ? "text-[var(--accent)]" : ""} />
          </button>
          <button
            onClick={() => { setShowGif((s) => !s); setShowEmoji(false); }}
            className={cn("shrink-0 rounded px-1.5 text-xs font-black active:scale-90", showGif ? "bg-[var(--accent)] text-black" : "bg-surface-2 text-muted")}
            aria-label="GIFs"
          >
            GIF
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 text-muted active:scale-90 disabled:opacity-50"
            aria-label="Add image"
          >
            <ImagePlus size={22} className={uploading ? "animate-pulse text-[var(--accent)]" : ""} />
          </button>
          <input ref={fileRef} type="file" accept="image/*,image/gif" hidden onChange={onFile} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={uploading ? "Uploading…" : "Talk your talk…"}
            maxLength={500}
            className="h-11 flex-1 rounded-full border border-border bg-surface-2 px-4 text-base outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={() => send()}
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

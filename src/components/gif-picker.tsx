"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Gif {
  id: string;
  preview: string;
  url: string;
}

export function GifPicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/gifs?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        if (!d.ok) setError(d.error || "GIF search unavailable");
        else {
          setError(null);
          setGifs(d.gifs);
        }
      } catch {
        setError("GIF search unavailable");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mb-2 rounded-xl border border-border bg-surface p-2">
      <div className="mb-2 flex items-center gap-2">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search GIFs…"
          className="h-9 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button onClick={onClose} className="text-muted active:scale-90" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      {error ? (
        <p className="py-6 text-center text-xs text-muted">{error}</p>
      ) : (
        <div className="no-scrollbar grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto">
          {loading && gifs.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-surface-2" />
              ))
            : gifs.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onSelect(g.url)}
                  className="overflow-hidden rounded-lg bg-surface-2 active:scale-95"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.preview} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
        </div>
      )}
      <p className="mt-1 text-center text-[9px] text-muted">Powered by GIPHY</p>
    </div>
  );
}

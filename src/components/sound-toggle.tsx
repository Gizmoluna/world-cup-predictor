"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, playClick } from "@/lib/sound";
import { cn } from "@/lib/utils";

export function SoundToggle() {
  const [muted, setM] = useState(false);
  useEffect(() => setM(isMuted()), []);

  function toggle() {
    const next = !muted;
    setM(next);
    setMuted(next);
    if (!next) playClick();
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
        muted ? "bg-white/8 text-muted" : "bg-[var(--accent-soft)] text-[var(--accent)]",
      )}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      {muted ? "Sound off" : "Sound on"}
    </button>
  );
}

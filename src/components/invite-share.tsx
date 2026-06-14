"use client";

import { useEffect, useState } from "react";
import { Share2, MessageSquare, Copy, Check } from "lucide-react";

export function InviteShare({ leagueName, code }: { leagueName: string; code: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"link" | "msg" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const link = origin ? `${origin}/join/${code}` : "";
  const text = `Join my World Cup Predictor league "${leagueName}" 🏆`;
  const message = `${text}\n${link}\n(or use code ${code})`;
  const enc = encodeURIComponent(message);

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "World Cup Predictor", text, url: link });
      } catch {
        /* user cancelled */
      }
    } else {
      copy("msg");
      setNote("Sharing not supported here — invite copied, paste it anywhere.");
    }
  }

  function copy(which: "link" | "msg") {
    navigator.clipboard?.writeText(which === "link" ? link : message);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  function instagram() {
    copy("msg");
    setNote("Invite copied — paste it into your Instagram DM 📷");
    window.open("https://instagram.com/direct/inbox/", "_blank");
  }

  const tile =
    "flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-2 py-3 text-[11px] font-bold transition active:scale-95";

  return (
    <div className="mt-3">
      <button
        onClick={nativeShare}
        disabled={!origin}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
      >
        <Share2 size={16} /> Share invite
      </button>

      <div className="mt-2 grid grid-cols-4 gap-2">
        <a className={tile} href={origin ? `https://wa.me/?text=${enc}` : undefined} target="_blank" rel="noopener noreferrer">
          <span className="text-lg">💬</span> WhatsApp
        </a>
        <a className={tile} href={origin ? `sms:?&body=${enc}` : undefined}>
          <MessageSquare size={18} /> Text
        </a>
        <button className={tile} onClick={instagram} disabled={!origin}>
          <span className="text-lg">📷</span> Instagram
        </button>
        <button className={tile} onClick={() => copy("link")} disabled={!origin}>
          {copied === "link" ? <Check size={18} className="text-pitch" /> : <Copy size={18} />} Link
        </button>
      </div>

      {note && <p className="mt-2 text-[11px] text-muted">{note}</p>}
    </div>
  );
}

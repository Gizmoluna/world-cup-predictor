"use client";

import { useEffect, useState } from "react";
import { Share2, MessageSquare, Copy, Check, Link2 } from "lucide-react";

async function copyText(t: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

export function InviteShare({ leagueName, code }: { leagueName: string; code: string }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | "msg" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const link = origin ? `${origin}/join/${code}` : "";
  const text = `Join my World Cup Predictor league "${leagueName}" 🏆`;
  const message = `${text}\n${link}\n(or use code ${code})`;
  const enc = encodeURIComponent(message);

  function flash(which: "code" | "link" | "msg") {
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "World Cup Predictor", text, url: link });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (await copyText(message)) {
      flash("msg");
      setNote("Invite copied — paste it anywhere.");
    }
  }

  function instagram() {
    copyText(message).then((ok) => {
      if (ok) {
        flash("msg");
        setNote("Invite copied — paste it into your Instagram DM 📷");
      }
      window.open("https://instagram.com/direct/inbox/", "_blank");
    });
  }

  const tile =
    "flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-2 py-3 text-[11px] font-bold transition active:scale-95";

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Big, obvious, copyable invite code */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2.5">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Invite code</div>
          <div className="num-bc select-all text-2xl tracking-[0.18em] text-[var(--accent)]">{code}</div>
        </div>
        <button
          onClick={() => copyText(code).then((ok) => ok && flash("code"))}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-black active:scale-95"
        >
          {copied === "code" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
      </div>

      {/* Selectable link (manual fallback) */}
      {link && (
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full select-all rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted outline-none"
        />
      )}

      <button
        onClick={nativeShare}
        disabled={!origin}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
      >
        <Share2 size={16} /> Share invite
      </button>

      <div className="grid grid-cols-4 gap-2">
        <a className={tile} href={origin ? `https://wa.me/?text=${enc}` : undefined} target="_blank" rel="noopener noreferrer">
          <span className="text-lg">💬</span> WhatsApp
        </a>
        <a className={tile} href={origin ? `sms:?&body=${enc}` : undefined}>
          <MessageSquare size={18} /> Text
        </a>
        <button className={tile} onClick={instagram} disabled={!origin}>
          <span className="text-lg">📷</span> Instagram
        </button>
        <button className={tile} onClick={() => copyText(link).then((ok) => ok && flash("link"))} disabled={!origin}>
          {copied === "link" ? <Check size={18} className="text-pitch" /> : <Link2 size={18} />} Link
        </button>
      </div>

      {note && <p className="text-[11px] text-muted">{note}</p>}
    </div>
  );
}

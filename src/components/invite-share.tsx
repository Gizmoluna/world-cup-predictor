"use client";

import { useEffect, useState } from "react";
import { Share2, Copy, Check, Link2, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);
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

  // Prefer the OS share sheet; fall back to copying the invite.
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

  const tile =
    "flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-2 py-3 text-[11px] font-bold transition active:scale-95";

  return (
    <>
      {/* The one share button */}
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black transition active:scale-[0.98]"
      >
        <Share2 size={16} /> Share invite
      </button>

      {/* Popup with everything */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div className="glass w-full max-w-sm rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="title-bc text-lg">Invite to {leagueName}</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full bg-white/8 p-1.5 text-muted active:scale-90">
                <X size={16} />
              </button>
            </div>

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

            {/* Selectable link */}
            {link && (
              <input
                readOnly
                value={link}
                onFocus={(e) => e.currentTarget.select()}
                className="mt-3 w-full select-all rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted outline-none"
              />
            )}

            <button
              onClick={nativeShare}
              disabled={!origin}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
            >
              <Share2 size={16} /> Share…
            </button>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <a className={tile} href={origin ? `https://wa.me/?text=${enc}` : undefined} target="_blank" rel="noopener noreferrer">
                <span className="text-lg">💬</span> WhatsApp
              </a>
              <a className={tile} href={origin ? `sms:?&body=${enc}` : undefined}>
                <span className="text-lg">✉️</span> Text
              </a>
              <button className={tile} onClick={() => copyText(link).then((ok) => ok && flash("link"))} disabled={!origin}>
                {copied === "link" ? <Check size={18} className="text-pitch" /> : <Link2 size={18} />} Link
              </button>
            </div>

            {note && <p className="mt-3 text-[11px] text-muted">{note}</p>}
          </div>
        </div>
      )}
    </>
  );
}

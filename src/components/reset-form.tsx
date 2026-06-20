"use client";

import { useState, useTransition } from "react";
import { resetPassword } from "@/app/actions";

export function ResetForm({ token }: { token: string }) {
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const r = await resetPassword(token, secret);
      // Success redirects; only errors return.
      if (r && !r.ok) setError(r.error ?? "Could not reset.");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3">
        <input
          type={show ? "text" : "password"}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="New PIN or password"
          className="flex-1 bg-transparent py-3 text-sm outline-none"
          autoFocus
        />
        <button onClick={() => setShow((s) => !s)} className="text-xs font-bold text-muted">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <p className="text-xs font-bold text-danger">{error}</p>}
      <button
        onClick={submit}
        disabled={pending || secret.length < 1}
        className="rounded-xl bg-[var(--accent)] py-3 text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Set new PIN & log in"}
      </button>
    </div>
  );
}

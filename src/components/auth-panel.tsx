"use client";

import { useState, useTransition } from "react";
import { signInWithEmail, signInWithGoogle } from "@/app/actions";
import { Button } from "./ui/button";

export function AuthPanel() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function sendLink() {
    setMsg(null);
    start(async () => {
      const res = await signInWithEmail(email);
      setMsg(
        res?.ok
          ? { ok: true, text: "Check your email for a magic sign-in link ✉️" }
          : { ok: false, text: res?.error ?? "Could not send link." },
      );
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base outline-none focus:border-[var(--accent)]"
      />
      <Button variant="accent" size="lg" disabled={pending || !email} onClick={sendLink}>
        {pending ? "Sending…" : "Email me a magic link"}
      </Button>

      <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Continue with Google
        </Button>
      </form>

      {msg && (
        <p className={msg.ok ? "text-sm font-bold text-pitch" : "text-sm font-bold text-danger"}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

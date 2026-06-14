"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { logIn, signUp } from "@/app/actions";
import { Button } from "./ui/button";
import { FLAG_OPTIONS, THEMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ExistingUser {
  name: string;
  flag: string;
}

export function AuthForm({ existing }: { existing: ExistingUser[] }) {
  const [mode, setMode] = useState<"login" | "signup">(existing.length ? "login" : "signup");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [flag, setFlag] = useState("⚽");
  const [theme, setTheme] = useState("carina");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res =
        mode === "login"
          ? await logIn({ name, secret, remember })
          : await signUp({ name, secret, flag, theme, remember });
      // On success the action redirects; only errors return here.
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="glass p-5 text-left">
      {/* tabs */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={cn(
              "rounded-lg py-2 text-sm font-bold transition",
              mode === m ? "bg-[var(--accent)] text-black" : "text-muted",
            )}
          >
            {m === "login" ? "Log in" : "Sign up"}
          </button>
        ))}
      </div>

      {mode === "login" && existing.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {existing.map((u) => (
            <button
              key={u.name}
              onClick={() => setName(u.name)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition active:scale-95",
                name === u.name ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted",
              )}
            >
              {u.flag} {u.name}
            </button>
          ))}
        </div>
      )}

      <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="username"
        className="mb-4 h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base outline-none focus:border-[var(--accent)]"
      />

      {mode === "signup" && (
        <>
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted">Your flag</label>
          <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {FLAG_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFlag(f)}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl transition active:scale-90",
                  flag === f ? "bg-[var(--accent)]" : "bg-white/8",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted">Theme</label>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={cn(
                  "rounded-xl py-3 text-sm font-bold transition active:scale-95",
                  theme === t.key ? "text-black" : "text-foreground",
                )}
                style={{ background: theme === t.key ? t.accent : "rgba(255,255,255,0.06)" }}
              >
                {t.flag} {t.label} style
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted">
        PIN or password
      </label>
      <div className="relative mb-4">
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          type={show ? "text" : "password"}
          inputMode="text"
          placeholder={mode === "signup" ? "Choose a PIN or password" : "Your PIN or password"}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 pr-12 text-base outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          type="button"
          aria-label="Toggle visibility"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <label className="mb-5 flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        Stay logged in on this device
      </label>

      {error && <p className="mb-3 text-sm font-bold text-danger">{error}</p>}

      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={pending || !name.trim() || !secret}
        onClick={submit}
      >
        {pending ? "…" : mode === "login" ? "Log in" : "Create account"}
      </Button>

      {mode === "login" && (
        <p className="mt-3 text-center text-xs text-muted">
          New here?{" "}
          <button onClick={() => setMode("signup")} className="font-bold text-[var(--accent)]">
            Create an account
          </button>
        </p>
      )}
    </div>
  );
}

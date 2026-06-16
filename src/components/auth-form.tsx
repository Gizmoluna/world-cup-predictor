"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { logIn, signUp } from "@/app/actions";
import { Button } from "./ui/button";
import { FLAG_OPTIONS, PICKER_THEMES, DEFAULT_THEME } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Minimum password length for a normal new account. Carina & Johnny are exempt
// server-side, but everyone signing up here needs at least this many characters.
const SIGNUP_MIN = 6;

// Per-device memory of who has signed in here — so returning players tap their
// OWN name instead of being shown a public roster of everyone.
const KNOWN_KEY = "wcp_known_accounts";
interface KnownAccount {
  name: string;
  flag: string;
}
function loadKnown(): KnownAccount[] {
  try {
    const raw = localStorage.getItem(KNOWN_KEY);
    return raw ? (JSON.parse(raw) as KnownAccount[]) : [];
  } catch {
    return [];
  }
}
function rememberAccount(acc: KnownAccount) {
  try {
    const list = loadKnown().filter((a) => a.name.toLowerCase() !== acc.name.toLowerCase());
    localStorage.setItem(KNOWN_KEY, JSON.stringify([acc, ...list].slice(0, 6)));
  } catch {
    /* ignore */
  }
}

export function AuthForm({ joinCode }: { joinCode?: string }) {
  const [known, setKnown] = useState<KnownAccount[]>([]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [show, setShow] = useState(false);
  const [flag, setFlag] = useState("⚽");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Read this device's remembered accounts on mount. New devices start empty,
  // defaulting to sign-up.
  useEffect(() => {
    const list = loadKnown();
    setKnown(list);
    if (list.length === 0) setMode("signup");
  }, []);

  function forget(n: string) {
    const next = known.filter((a) => a.name !== n);
    setKnown(next);
    try {
      localStorage.setItem(KNOWN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const tooShort = mode === "signup" && secret.length > 0 && secret.length < SIGNUP_MIN;

  function submit() {
    setError(null);
    if (mode === "signup" && secret.length < SIGNUP_MIN) {
      setError(`Password must be at least ${SIGNUP_MIN} letters or numbers.`);
      return;
    }
    // Remember this name on the device optimistically; if the action fails it's
    // harmless, and on success it redirects away before we'd clean up anyway.
    rememberAccount({ name: name.trim(), flag: mode === "signup" ? flag : "👤" });
    start(async () => {
      const res =
        mode === "login"
          ? await logIn({ name, secret, remember, joinCode })
          : await signUp({ name, secret, flag, theme, remember, joinCode });
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

      {mode === "login" && known.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted">
            Continue as
          </p>
          <div className="flex flex-wrap gap-2">
            {known.map((u) => (
              <span
                key={u.name}
                className={cn(
                  "flex items-center gap-1 rounded-full pl-3 pr-1 py-1 text-xs font-bold transition",
                  name === u.name ? "bg-[var(--accent)] text-black" : "bg-white/8 text-muted",
                )}
              >
                <button onClick={() => setName(u.name)} className="active:scale-95">
                  {u.flag} {u.name}
                </button>
                <button
                  onClick={() => forget(u.name)}
                  aria-label={`Forget ${u.name}`}
                  className="rounded-full p-0.5 opacity-60 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
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

          <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted">Colour</label>
          <div className="mb-4 grid grid-cols-5 gap-2">
            {PICKER_THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.label}
                aria-label={t.label}
                className={cn(
                  "flex h-10 items-center justify-center rounded-xl transition active:scale-90",
                  theme === t.key ? "ring-2 ring-white" : "",
                )}
                style={{ background: t.accent }}
              >
                {theme === t.key && <span className="text-black">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-muted">
        {mode === "signup" ? "Choose a password" : "PIN or password"}
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

      {mode === "signup" && (
        <div className="mb-4 -mt-2 rounded-xl bg-surface-2 p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Password rules
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted">
            <li className={cn(secret.length >= SIGNUP_MIN && "text-pitch")}>
              {secret.length >= SIGNUP_MIN ? "✓" : "•"} At least {SIGNUP_MIN} letters or numbers
            </li>
            <li>• Letters, numbers or symbols — your choice</li>
            <li>• Write it down — you&apos;ll need it to log back in</li>
          </ul>
          {tooShort && (
            <p className="mt-1 text-xs font-bold text-danger">
              {SIGNUP_MIN - secret.length} more character{SIGNUP_MIN - secret.length === 1 ? "" : "s"} to go
            </p>
          )}
        </div>
      )}

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
        disabled={pending || !name.trim() || !secret || tooShort}
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

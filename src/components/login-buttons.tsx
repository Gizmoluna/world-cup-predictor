"use client";

import { useState, useTransition } from "react";
import { loginAs } from "@/app/actions";

interface LoginUser {
  id: string;
  name: string;
  flag: string;
  nationality: string;
  gradient: string;
}

export function LoginButtons({ users }: { users: LoginUser[] }) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);

  function go(id: string) {
    setSelected(id);
    startTransition(() => {
      // PIN is optional; pass-through hook kept for future per-user PINs.
      void loginAs(id);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((u) => (
        <button
          key={u.id}
          disabled={pending}
          onClick={() => go(u.id)}
          className="glass flex items-center gap-4 p-4 text-left transition active:scale-[0.98] disabled:opacity-60"
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
            style={{ background: u.gradient }}
          >
            {u.flag}
          </span>
          <span className="flex-1">
            <span className="block text-lg font-extrabold">Continue as {u.name}</span>
            <span className="block text-xs text-muted">{u.nationality}</span>
          </span>
          <span className="text-[var(--accent)]">
            {pending && selected === u.id ? "…" : "→"}
          </span>
        </button>
      ))}
    </div>
  );
}

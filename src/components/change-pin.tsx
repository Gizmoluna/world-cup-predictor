"use client";

import { useState, useTransition } from "react";
import { changePin } from "@/app/actions";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function ChangePin() {
  const [secret, setSecret] = useState("");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setMsg(null);
    start(async () => {
      const res = await changePin(secret);
      if (res.ok) { setSecret(""); setOpen(false); setMsg({ ok: true, text: "PIN/password updated ✅" }); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  if (!open) {
    return (
      <div>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>Change PIN / password</Button>
        {msg && <p className={cn("mt-2 text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="New PIN or password"
        autoComplete="new-password"
        className="h-11 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-[var(--accent)]"
      />
      <div className="flex gap-2">
        <Button variant="accent" size="sm" disabled={pending || secret.length < 4} onClick={save}>Save</Button>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setSecret(""); }}>Cancel</Button>
      </div>
      {msg && <p className={cn("text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>{msg.text}</p>}
    </div>
  );
}

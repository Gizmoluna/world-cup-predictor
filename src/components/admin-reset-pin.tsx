"use client";

import { useState, useTransition } from "react";
import { adminResetPin } from "@/app/actions";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface UserLite {
  id: string;
  name: string;
  flag: string;
}

export function AdminResetPin({ users }: { users: UserLite[] }) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [secret, setSecret] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function run(clear: boolean) {
    setMsg(null);
    start(async () => {
      const res = await adminResetPin({ userId, newSecret: clear ? undefined : secret });
      if (res.ok) {
        setSecret("");
        setMsg({
          ok: true,
          text:
            res.mode === "cleared"
              ? `${res.name}'s PIN cleared — they set a new one on next login.`
              : `${res.name}'s PIN has been reset.`,
        });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  if (!users.length) return <p className="text-sm text-muted">No players yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-surface-2 px-4 text-sm font-semibold outline-none focus:border-[var(--accent)]"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.flag} {u.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="New PIN or password (optional)"
        className="h-11 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-[var(--accent)]"
      />

      <div className="flex gap-2">
        <Button variant="accent" size="sm" disabled={pending || !userId || secret.length < 4} onClick={() => run(false)}>
          Set new PIN
        </Button>
        <Button variant="primary" size="sm" disabled={pending || !userId} onClick={() => run(true)}>
          Clear (let them re-set)
        </Button>
      </div>

      <p className="text-[11px] text-muted">
        &ldquo;Set new PIN&rdquo; gives them a temporary PIN to tell them. &ldquo;Clear&rdquo; means the next
        PIN they type when logging in becomes theirs.
      </p>

      {msg && (
        <p className={cn("text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>{msg.text}</p>
      )}
    </div>
  );
}

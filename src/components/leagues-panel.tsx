"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { InviteShare } from "./invite-share";
import { DeleteLeagueButton } from "./delete-league-button";
import { createLeagueAction, joinLeagueAction, setActiveLeague } from "@/app/actions";
import { cn } from "@/lib/utils";

interface LeagueRow {
  id: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  isActive: boolean;
  memberCount: number;
}

export function LeaguesPanel({ leagues }: { leagues: LeagueRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = () => router.refresh();

  function create() {
    setMsg(null);
    start(async () => {
      const res = await createLeagueAction(name);
      if (res.ok) { setName(""); setMsg({ ok: true, text: `Created "${res.league.name}" 🎉` }); refresh(); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  function join() {
    setMsg(null);
    start(async () => {
      const res = await joinLeagueAction(code);
      if (res.ok) { setCode(""); setMsg({ ok: true, text: `Joined "${res.league.name}" 🤝` }); refresh(); }
      else setMsg({ ok: false, text: res.error });
    });
  }

  function switchTo(id: string) {
    start(async () => { await setActiveLeague(id); refresh(); });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        {leagues.map((l) => (
          <div key={l.id} className={cn("glass card-bc p-4", l.isActive && "ring-1 ring-[var(--accent)]/50")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="title-bc truncate text-base">{l.name}</span>
                {l.isOwner && <Crown size={14} className="shrink-0 text-gold" />}
                {l.isActive && <Badge tone="accent">Active</Badge>}
              </div>
              <span className="shrink-0 text-xs text-muted">
                {l.memberCount} player{l.memberCount === 1 ? "" : "s"}
              </span>
            </div>

            {!l.isActive && (
              <Button size="sm" variant="outline" className="mt-3 w-full" disabled={pending} onClick={() => switchTo(l.id)}>
                Switch to this league
              </Button>
            )}

            <InviteShare leagueName={l.name} code={l.inviteCode} />

            {l.isOwner && (
              <div className="mt-3 flex justify-end border-t border-border/60 pt-2">
                <DeleteLeagueButton leagueId={l.id} name={l.name} />
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="glass p-4">
        <h2 className="mb-3 text-sm font-bold">Create a league</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Carina's Crew"
            className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-[var(--accent)]"
          />
          <Button variant="accent" disabled={pending || !name.trim()} onClick={create}>Create</Button>
        </div>
      </section>

      <section className="glass p-4">
        <h2 className="mb-3 text-sm font-bold">Join with a code</h2>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="INVITE CODE"
            className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm uppercase tracking-widest outline-none focus:border-[var(--accent)]"
          />
          <Button variant="primary" disabled={pending || !code.trim()} onClick={join}>Join</Button>
        </div>
      </section>

      {msg && (
        <p className={cn("text-center text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>{msg.text}</p>
      )}
    </div>
  );
}

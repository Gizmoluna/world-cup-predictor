"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { InviteShare } from "./invite-share";
import { DeleteLeagueButton } from "./delete-league-button";
import { FriendButton } from "./friend-button";
import {
  createLeagueAction,
  joinLeagueAction,
  setActiveLeague,
  requestJoinAction,
  approveJoinAction,
  denyJoinAction,
} from "@/app/actions";
import { cn } from "@/lib/utils";

interface PendingUser {
  id: string;
  name: string;
  flag: string;
}
interface LeagueRow {
  id: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  isActive: boolean;
  memberCount: number;
  requests: PendingUser[];
}
interface DiscoverRow {
  id: string;
  name: string;
  memberCount: number;
  requested: boolean;
}
interface PlayerRow {
  id: string;
  name: string;
  flag: string;
  state: "friends" | "incoming" | "outgoing" | "none";
}

export function LeaguesPanel({
  leagues,
  discover,
  players = [],
  isAdmin = false,
}: {
  leagues: LeagueRow[];
  discover: DiscoverRow[];
  players?: PlayerRow[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  function requestJoin(id: string) {
    setBusyId(id);
    setMsg(null);
    start(async () => {
      const r = await requestJoinAction(id);
      setBusyId(null);
      if (r.ok) refresh();
      else setMsg({ ok: false, text: r.error ?? "Couldn't send request." });
    });
  }
  function approve(leagueId: string, userId: string) {
    setBusyId(userId);
    start(async () => { await approveJoinAction(leagueId, userId); setBusyId(null); refresh(); });
  }
  function deny(leagueId: string, userId: string) {
    setBusyId(userId);
    start(async () => { await denyJoinAction(leagueId, userId); setBusyId(null); refresh(); });
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

            {l.isOwner && l.requests.length > 0 && (
              <div className="mt-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
                  Join requests ({l.requests.length})
                </p>
                <div className="flex flex-col gap-2">
                  {l.requests.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold">{r.flag} {r.name}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="accent" disabled={busyId === r.id} onClick={() => approve(l.id, r.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => deny(l.id, r.id)}>
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <InviteShare leagueName={l.name} code={l.inviteCode} />

            {l.isOwner && (
              <div className="mt-3 border-t border-border/60 pt-3">
                <DeleteLeagueButton leagueId={l.id} name={l.name} />
              </div>
            )}
          </div>
        ))}
      </section>

      {discover.length > 0 && (
        <section className="glass p-4">
          <h2 className="mb-3 text-sm font-bold">Discover leagues</h2>
          <div className="flex flex-col gap-2">
            {discover.map((d) => (
              <div key={d.id} className="rounded-xl bg-surface-2 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{d.name}</p>
                    <p className="text-[11px] text-muted">{d.memberCount} player{d.memberCount === 1 ? "" : "s"}</p>
                  </div>
                  {d.requested ? (
                    <span className="text-xs font-bold text-pitch">Requested ✓</span>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busyId === d.id} onClick={() => requestJoin(d.id)}>
                      {busyId === d.id ? "…" : "Request to join"}
                    </Button>
                  )}
                </div>
                {isAdmin && (
                  <div className="mt-2 border-t border-border/60 pt-2">
                    <DeleteLeagueButton leagueId={d.id} name={d.name} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {players.length > 0 && (
        <section className="glass p-4">
          <h2 className="mb-3 text-sm font-bold">Find players · add friends</h2>
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
                <span className="truncate text-sm font-bold">{p.flag} {p.name}</span>
                <FriendButton targetId={p.id} state={p.state} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass p-4">
        <h2 className="mb-1 text-sm font-bold">Create a league</h2>
        <p className="mb-3 text-xs text-muted">
          Your own private league with friends. Everyone predicts every match, and you can{" "}
          <span className="font-bold text-pitch">wager on any match</span> — duel a rival on the
          score or open a whole-group pot — with all{" "}
          <span className="font-bold text-fg">winnings &amp; debts tracked</span> for the league.
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Carina's Crew"
            className="h-11 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-[var(--accent)]"
          />
          <Button variant="accent" disabled={pending || !name.trim()} onClick={create}>Create</Button>
        </div>
        <ul className="mt-3 space-y-1 text-[11px] text-muted">
          <li>⚔️ <span className="font-bold text-fg">Duels</span> — bet a rival on the 90′ score (full or split across markets)</li>
          <li>💰 <span className="font-bold text-fg">Group pots</span> — whole-league pot per match, you pick how it&apos;s won</li>
          <li>📊 <span className="font-bold text-fg">Ledger</span> — running winnings &amp; who-owes-whom on the Duels tab</li>
        </ul>
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

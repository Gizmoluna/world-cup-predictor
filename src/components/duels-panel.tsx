"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondDuelAction } from "@/app/actions";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  stake: number;
  status: string;
  otherName: string;
  otherFlag: string;
  matchLabel: string;
  isIncoming: boolean;
  settled: boolean;
  won: boolean;
  push: boolean;
  actual: string | null;
  myGuess: string | null;
  theirGuess: string | null;
}

export function DuelsPanel({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function respond(id: string, accept: boolean) {
    start(async () => { await respondDuelAction(id, accept); router.refresh(); });
  }

  const incoming = rows.filter((r) => r.isIncoming);
  const active = rows.filter((r) => r.status === "accepted" && !r.settled);
  const results = rows.filter((r) => r.settled);
  const outgoing = rows.filter((r) => r.status === "pending" && !r.isIncoming);

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No duels yet. Open a match before kickoff and challenge a friend on the score.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {incoming.length > 0 && (
        <Section title={`Challenges for you (${incoming.length})`}>
          {incoming.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{r.otherFlag} {r.otherName} · ${r.stake}</p>
                <p className="text-[11px] text-muted">{r.matchLabel} · correct 90′ score</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="accent" disabled={pending} onClick={() => respond(r.id, true)}>Accept</Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => respond(r.id, false)}>Decline</Button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {active.length > 0 && (
        <Section title="Live duels">
          {active.map((r) => (
            <Line key={r.id} r={r} note="awaiting result" />
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Awaiting their answer">
          {outgoing.map((r) => (
            <Line key={r.id} r={r} note="pending" />
          ))}
        </Section>
      )}

      {results.length > 0 && (
        <Section title="Results">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{r.otherFlag} {r.otherName}</span>
                <span
                  className={cn(
                    "num-bc text-sm",
                    r.push ? "text-muted" : r.won ? "text-pitch" : "text-danger",
                  )}
                >
                  {r.push ? "Push" : r.won ? `+$${r.stake}` : `−$${r.stake}`}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {r.matchLabel} · actual {r.actual} · you {r.myGuess ?? "—"} / them {r.theirGuess ?? "—"}
              </p>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="title-bc text-xs tracking-[0.14em] text-[var(--accent)]">{title}</h2>
      {children}
    </section>
  );
}

function Line({ r, note }: { r: Row; note: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{r.otherFlag} {r.otherName} · ${r.stake}</p>
        <p className="text-[11px] text-muted">{r.matchLabel}</p>
      </div>
      <span className="text-[11px] uppercase text-muted">{note}</span>
    </div>
  );
}

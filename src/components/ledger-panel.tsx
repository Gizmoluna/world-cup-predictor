import Link from "next/link";

interface MemberRow {
  userId: string;
  name: string;
  flag: string;
  net: number;
  won: number;
  lost: number;
  pending: number;
}
interface DebtRow {
  fromName: string;
  fromFlag: string;
  toName: string;
  toFlag: string;
  amount: number;
}

// League money board: each member's overall winnings/debts, plus a simplified
// "who owes whom" settle-up list — all in the app's fake currency.
export function LedgerPanel({
  members,
  debts,
}: {
  members: MemberRow[];
  debts: DebtRow[];
}) {
  const anyAction = members.some((m) => m.net !== 0 || m.pending > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass card-bc overflow-hidden">
        <h2 className="title-bc px-4 pt-3 text-sm text-[var(--accent)]">Winnings &amp; debts</h2>
        <ol className="mt-2 divide-y divide-border">
          {members.map((m) => (
            <li key={m.userId}>
              <Link
                href={`/profile/${m.userId}`}
                className="flex items-center gap-3 px-4 py-2.5 transition active:bg-white/5"
              >
                <span className="text-xl">{m.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{m.name}</span>
                  <span className="block text-[10px] text-muted">
                    won ${m.won} · lost ${m.lost}
                    {m.pending > 0 ? ` · $${m.pending} riding` : ""}
                  </span>
                </span>
                <span
                  className={`num-bc text-2xl ${m.net > 0 ? "text-pitch" : m.net < 0 ? "text-danger" : "text-muted"}`}
                >
                  {m.net >= 0 ? "+" : "−"}${Math.abs(m.net)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
        {!anyAction && (
          <p className="border-t border-border px-4 py-3 text-center text-[11px] text-muted">
            No settled wagers yet. Challenge a rival on a match to get the ledger moving. ⚔️
          </p>
        )}
      </div>

      {debts.length > 0 && (
        <div className="glass card-bc overflow-hidden">
          <h2 className="title-bc px-4 pt-3 text-sm text-[var(--accent)]">Settle up</h2>
          <ol className="mt-2 divide-y divide-border">
            {debts.map((d, i) => (
              <li key={i} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                <span className="font-bold">
                  {d.fromFlag} {d.fromName}
                </span>
                <span className="text-muted">owes</span>
                <span className="font-bold">
                  {d.toFlag} {d.toName}
                </span>
                <span className="num-bc ml-auto text-lg text-gold">${d.amount}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

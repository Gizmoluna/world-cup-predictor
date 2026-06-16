import { requireUser } from "@/lib/session";
import { getUsers } from "@/lib/data";
import { getUserDuels, resolveDuel, getDuelBalance } from "@/lib/duels";
import { getProvider } from "@/lib/football-api/provider";
import { chrome } from "@/lib/display";
import { AppShell } from "@/components/app-shell";
import { DuelsPanel } from "@/components/duels-panel";

export const dynamic = "force-dynamic";

export default async function DuelsPage() {
  const user = await requireUser();
  const [duels, users, matches, balance] = await Promise.all([
    getUserDuels(user.id),
    getUsers(),
    getProvider().getMatches(),
    getDuelBalance(user.id),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const teamShort = (id: string) => matches.find((m) => m.id === id);

  const rows = await Promise.all(
    duels.map(async (d) => {
      const o = await resolveDuel(d);
      const otherId = d.challengerId === user.id ? d.opponentId : d.challengerId;
      const other = userById.get(otherId);
      const m = teamShort(d.matchId);
      return {
        id: d.id,
        stake: d.stake,
        status: d.status,
        otherName: other?.name ?? otherId,
        otherFlag: other ? chrome(other).flag : "⚽",
        matchLabel: m ? `${m.homeTeamId.toUpperCase()} v ${m.awayTeamId.toUpperCase()}` : "Match",
        isIncoming: d.status === "pending" && d.opponentId === user.id,
        settled: o.settled,
        won: o.settled && o.winnerId === user.id,
        push: o.settled && !o.winnerId,
        actual: o.actual,
        myGuess: d.challengerId === user.id ? o.challengerGuess : o.opponentGuess,
        theirGuess: d.challengerId === user.id ? o.opponentGuess : o.challengerGuess,
      };
    }),
  );

  return (
    <AppShell>
      <h1 className="title-bc text-3xl">Duels ⚔️💵</h1>
      <p className="mb-3 text-sm text-muted">Bet a friend on the 90-minute score. Closest scoreline wins the pot.</p>
      <div className="glass card-bc mb-4 flex items-center justify-between p-4">
        <span className="title-bc text-sm text-muted">Your duel bankroll</span>
        <span className={`num-bc text-3xl ${balance >= 0 ? "text-pitch" : "text-danger"}`}>
          {balance >= 0 ? "+" : "−"}${Math.abs(balance)}
        </span>
      </div>
      <DuelsPanel rows={rows} />
    </AppShell>
  );
}

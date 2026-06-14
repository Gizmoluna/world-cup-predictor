import { requireUser, getActiveLeague } from "@/lib/session";
import { getLeagueMembers } from "@/lib/leagues";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { computeDerivedFacts } from "@/lib/facts";
import { AppShell } from "@/components/app-shell";
import { FactsFeed } from "@/components/facts-feed";

export const dynamic = "force-dynamic";

export default async function FactsPage() {
  const user = await requireUser();
  const league = await getActiveLeague(user.id);
  const members = league ? await getLeagueMembers(league.id) : [user];

  const [model, bank] = await Promise.all([
    getReadModel({ restrictUserIds: members.map((m) => m.id) }),
    getProvider().getFacts(),
  ]);

  const derived = computeDerivedFacts(model);
  // Live facts first, then the evergreen bank.
  const facts = [...derived, ...bank];

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-black">World Cup Facts</h1>
      <p className="mb-4 text-sm text-muted">
        {facts.length} facts and counting — live stats update as results come in.
      </p>
      <FactsFeed facts={facts} generatedAt={Date.now()} />
    </AppShell>
  );
}

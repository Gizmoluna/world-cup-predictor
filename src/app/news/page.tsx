import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getProvider } from "@/lib/football-api/provider";
import { AppShell } from "@/components/app-shell";
import { NewsFeed } from "@/components/news-feed";
import type { Team } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  await requireUser();
  const [model, news] = await Promise.all([getReadModel(), getProvider().getNews()]);

  // Serialize: convert the teamById Map to a plain object for the client.
  const teamsById: Record<string, Team> = {};
  for (const [id, team] of model.teamById) teamsById[id] = team;

  const favOf = (userId: string) =>
    model.users.find((u) => u.id === userId)?.favouriteTeamId ?? undefined;

  const userFavTeams = {
    carina: favOf("carina"),
    johnny: favOf("johnny"),
  };

  const sorted = [...news].sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black">News</h1>
          <p className="text-sm text-muted">
            Team news, injuries and lineups for the clash.
          </p>
        </div>

        <NewsFeed news={sorted} teamsById={teamsById} userFavTeams={userFavTeams} />
      </div>
    </AppShell>
  );
}

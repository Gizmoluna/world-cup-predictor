import Link from "next/link";

// One-tap access from Home to every corner of the app, so the deeper pages
// (insights, standings, friends, badges) aren't buried behind in-page links.
const TILES = [
  { href: "/live", icon: "🔴", label: "Live", sub: "Match centers" },
  { href: "/insights", icon: "📊", label: "Insights", sub: "Golden Boot, stats" },
  { href: "/standings", icon: "📋", label: "Standings", sub: "Group tables · teams" },
  { href: "/friends", icon: "🤝", label: "Friends", sub: "Picks & requests" },
  { href: "/badges", icon: "🏅", label: "Badges", sub: "Earn the collection" },
  { href: "/leaderboard", icon: "🏆", label: "Leaderboard", sub: "Who's on top" },
];

export function ExploreGrid() {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="title-bc px-1 text-sm text-muted">Explore</h2>
      <div className="grid grid-cols-2 gap-2">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="glass flex items-center gap-2.5 p-3 transition active:scale-[0.98]"
          >
            <span className="text-2xl">{t.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{t.label}</p>
              <p className="truncate text-[11px] text-muted">{t.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

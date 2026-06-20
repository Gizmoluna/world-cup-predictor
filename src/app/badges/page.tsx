import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { BADGES } from "@/lib/scoring/badges";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const;
const RARITY_TONE: Record<string, string> = {
  legendary: "text-gold",
  epic: "text-[var(--accent)]",
  rare: "text-pitch",
  common: "text-muted",
};

export default async function BadgesPage() {
  const user = await requireUser();
  const model = await getReadModel();
  const mine = new Set(model.leaderboard.find((r) => r.user.id === user.id)?.badges ?? []);

  const all = Object.values(BADGES).sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity as never) - RARITY_ORDER.indexOf(b.rarity as never),
  );
  const earned = all.filter((b) => mine.has(b.id)).length;

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="title-bc text-3xl">Badges</h1>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
          {earned}/{all.length} earned
        </span>
      </div>

      <Card className="flex flex-col gap-2">
        <CardTitle>Every badge &amp; how to earn it</CardTitle>
        <div className="mt-1 flex flex-col divide-y divide-border">
          {all.map((b) => {
            const have = mine.has(b.id);
            return (
              <div key={b.id} className={cn("flex items-center gap-3 py-3", !have && "opacity-55")}>
                <span className="text-3xl">{b.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold">{b.name}</p>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", RARITY_TONE[b.rarity] ?? "text-muted")}>
                      {b.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{b.description}</p>
                </div>
                {have && <span className="shrink-0 rounded-full bg-pitch/20 px-2 py-1 text-[10px] font-black text-pitch">EARNED</span>}
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}

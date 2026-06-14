import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { getUsers } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPanel } from "@/components/admin-panel";
import { AdminResetPin } from "@/components/admin-reset-pin";
import { isAdmin } from "@/lib/constants";
import { chrome } from "@/lib/display";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "default" | "live" | "win" | "warning"> = {
  upcoming: "default",
  live: "live",
  full_time: "win",
  postponed: "warning",
};

export default async function AdminPage() {
  const user = await requireUser();
  const [model, users] = await Promise.all([getReadModel(), getUsers()]);
  const admin = isAdmin(user.id);
  const userList = users.map((u) => ({ id: u.id, name: u.name, flag: chrome(u).flag }));

  const scoredCount = model.scoredMatches.length;

  const recent = [...model.matches]
    .sort((a, b) => +new Date(b.kickoffAt) - +new Date(a.kickoffAt))
    .slice(0, 10);

  // Plain serializable predictions for client-side CSV export.
  const exportPredictions = model.predictions.map((p) => ({
    userId: p.userId,
    matchId: p.matchId,
    predictedHomeScore: p.predictedHomeScore,
    predictedAwayScore: p.predictedAwayScore,
    predictedWinnerTeamId: p.predictedWinnerTeamId ?? null,
    confidenceMultiplier: p.confidenceMultiplier ?? null,
  }));

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">Admin / Manual Override</h1>
          <p className="mt-1 rounded-xl bg-gold/15 px-3 py-2 text-xs font-semibold text-gold">
            ⚠️ Power-user area. These actions sync external data and recompute
            scores. Score edits require Supabase configured.
          </p>
        </div>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Matches
            </span>
            <span className="text-xl font-black">{model.matches.length}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Predictions
            </span>
            <span className="text-xl font-black">{model.predictions.length}</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Scored
            </span>
            <span className="text-xl font-black">{scoredCount}</span>
          </div>
        </div>

        {/* Reset a friend's PIN (admins only) */}
        {admin && (
          <Card className="flex flex-col gap-3">
            <CardTitle>Reset a friend&apos;s PIN</CardTitle>
            <AdminResetPin users={userList} />
          </Card>
        )}

        {/* Sync + export */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Sync &amp; recompute</CardTitle>
          <AdminPanel predictions={exportPredictions} />
        </Card>

        {/* Recent matches */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Recent matches</CardTitle>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No matches loaded.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recent.map((m) => {
                const home = model.teamById.get(m.homeTeamId);
                const away = model.teamById.get(m.awayTeamId);
                const hasScore = m.homeScore !== null && m.awayScore !== null;
                return (
                  <div key={m.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {home?.shortName ?? home?.name ?? "TBD"} v{" "}
                      {away?.shortName ?? away?.name ?? "TBD"}
                    </span>
                    <span className="font-mono text-sm tabular-nums">
                      {hasScore ? `${m.homeScore}–${m.awayScore}` : "—"}
                    </span>
                    <Badge tone={STATUS_TONE[m.status] ?? "default"}>
                      {m.status.replace("_", " ")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

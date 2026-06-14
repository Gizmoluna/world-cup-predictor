import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const model = await getReadModel();

  // Plain serializable copy passed down to the client form.
  const plainUser = {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    nationality: user.nationality ?? null,
    favouriteTeamId: user.favouriteTeamId ?? null,
    favouritePlayerId: user.favouritePlayerId ?? null,
    theme: user.theme,
    worldCupWinnerPickId: user.worldCupWinnerPickId ?? null,
    goldenBootPickId: user.goldenBootPickId ?? null,
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">Settings</h1>
          <p className="text-sm text-muted">Tune your profile, picks and theme.</p>
        </div>

        <Card>
          <SettingsForm user={plainUser} teams={model.teams} players={model.players} />
        </Card>

        <Card className="flex flex-col gap-3">
          <CardTitle>Account</CardTitle>
          <SignOutButton />
        </Card>
      </div>
    </AppShell>
  );
}

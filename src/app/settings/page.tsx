import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getReadModel } from "@/lib/aggregate";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";
import { SignOutButton } from "@/components/sign-out-button";
import { ChangePin } from "@/components/change-pin";
import { SoundToggle } from "@/components/sound-toggle";
import { EnableNotifications } from "@/components/enable-notifications";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const model = await getReadModel();

  // Plain serializable copy passed down to the client form.
  const plainUser = {
    id: user.id,
    name: user.name,
    flag: user.flag ?? null,
    avatarUrl: user.avatarUrl ?? null,
    nationality: user.nationality ?? null,
    homeCountry: user.homeCountry ?? user.nationality ?? null,
    adoptedCountry: user.adoptedCountry ?? null,
    favouriteCountry: user.favouriteCountry ?? null,
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
          <EnableNotifications />
          <SoundToggle />
          <ChangePin />
          <Link
            href="/how-it-works"
            className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-sm font-bold transition active:scale-[0.99]"
          >
            How scoring &amp; penalties work
            <span className="text-[var(--accent)]">📖</span>
          </Link>
          <SignOutButton />
        </Card>
      </div>
    </AppShell>
  );
}

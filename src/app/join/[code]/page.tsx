import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getLeagueByCode, getLeagueMembers } from "@/lib/leagues";
import { getUsers } from "@/lib/data";
import { chrome } from "@/lib/display";
import { AuthForm } from "@/components/auth-form";
import { JoinConfirm } from "@/components/join-confirm";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const league = await getLeagueByCode(code);
  const user = await getCurrentUser();

  return (
    <div className="pitch-lines relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="text-5xl drop-shadow-[0_0_24px_rgba(255,211,77,0.5)]">🏆</div>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">{APP_NAME}</p>

        {!league ? (
          <div className="mt-8 glass w-full p-6">
            <p className="text-lg font-extrabold">Invite not found</p>
            <p className="mt-2 text-sm text-muted">
              That invite code (<span className="font-mono">{code}</span>) doesn&apos;t match a league.
            </p>
            <Link href="/" className="mt-4 inline-block font-bold text-[var(--accent)]">Go to the app →</Link>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-black leading-tight">
              You&apos;re invited to
              <span className="block text-[var(--accent)]">{league.name}</span>
            </h1>
            <p className="mt-2 text-sm text-muted">
              {(await getLeagueMembers(league.id)).length} player(s) · code{" "}
              <span className="font-mono font-bold">{league.inviteCode}</span>
            </p>

            <div className="mt-8 w-full">
              {user ? (
                <JoinConfirm code={league.inviteCode} leagueName={league.name} userName={user.name} />
              ) : (
                <>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">
                    Sign up or log in to join
                  </p>
                  <AuthForm
                    existing={(await getUsers()).map((u) => ({ name: u.name, flag: chrome(u).flag }))}
                    joinCode={league.inviteCode}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

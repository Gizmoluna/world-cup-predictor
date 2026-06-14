import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getUsers } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE, rival, THEMES } from "@/lib/constants";
import { LoginButtons } from "@/components/login-buttons";
import { AuthPanel } from "@/components/auth-panel";

export default async function LandingPage() {
  if (await getSessionUserId()) redirect("/dashboard");
  const users = await getUsers();
  const useAuth = isSupabaseConfigured();

  return (
    <div className="pitch-lines relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-6xl drop-shadow-[0_0_24px_rgba(255,211,77,0.5)]">🏆</div>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
          {APP_NAME}
        </h1>
        <p className="mt-1 bg-gradient-to-r from-gold to-pitch bg-clip-text text-lg font-extrabold uppercase tracking-[0.2em] text-transparent">
          {APP_TAGLINE}
        </p>
        <p className="mt-3 max-w-xs text-sm text-muted">{APP_SUBTITLE}</p>

        <div className="mt-10 w-full">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">
            {useAuth ? "Sign in to play" : "Who's predicting?"}
          </p>
          {useAuth ? (
            <AuthPanel />
          ) : (
            <LoginButtons
              users={users.map((u) => ({
                id: u.id,
                name: u.name,
                flag: rival(u.id)?.flag ?? u.flag ?? "⚽",
                nationality: u.nationality ?? "",
                gradient: THEMES[u.theme]?.gradient ?? THEMES.carina.gradient,
              }))}
            />
          )}
        </div>

        <p className="mt-8 text-xs text-muted">
          Carina vs Johnny · Lock in before kickoff · No takebacks
        </p>
      </div>
    </div>
  );
}

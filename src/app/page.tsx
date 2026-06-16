import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { APP_NAME, APP_SUBTITLE, APP_TAGLINE } from "@/lib/constants";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (await getSessionUserId()) redirect("/dashboard");

  return (
    <div className="pitch-lines relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="text-6xl drop-shadow-[0_0_24px_rgba(255,211,77,0.5)]">🏆</div>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">{APP_NAME}</h1>
        <p className="mt-1 bg-gradient-to-r from-gold to-pitch bg-clip-text text-lg font-extrabold uppercase tracking-[0.2em] text-transparent">
          {APP_TAGLINE}
        </p>
        <p className="mt-3 max-w-xs text-sm text-muted">{APP_SUBTITLE}</p>

        <div className="mt-10 w-full">
          <AuthForm />
        </div>

        <p className="mt-8 text-xs text-muted">
          Pick a name + PIN · stay logged in · predict every match
        </p>
      </div>
    </div>
  );
}

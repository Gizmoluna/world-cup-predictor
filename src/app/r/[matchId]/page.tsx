import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getSessionUserId } from "@/lib/session";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function cardUrl(base: string, matchId: string, sp: Record<string, string | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const k of ["name", "pts", "tag"]) {
    const v = sp[k];
    if (typeof v === "string") qs.set(k, v);
  }
  return `${base}/api/share/${matchId}?${qs.toString()}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: SP;
}): Promise<Metadata> {
  const { matchId } = await params;
  const sp = await searchParams;
  const img = cardUrl(await baseUrl(), matchId, sp);
  const name = typeof sp.name === "string" ? sp.name : "";
  return {
    title: `${name ? `${name}'s ` : ""}${APP_NAME} result`,
    description: "Predict every World Cup match. Beat your friends. Join free.",
    openGraph: { title: APP_NAME, description: "Predict every match. Beat your friends.", images: [img] },
    twitter: { card: "summary_large_image", images: [img] },
  };
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: SP;
}) {
  const { matchId } = await params;
  const sp = await searchParams;
  const img = cardUrl(await baseUrl(), matchId, sp);
  const loggedIn = Boolean(await getSessionUserId());

  return (
    <div className="pitch-lines relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="relative z-10 flex w-full flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="Result card" className="w-full rounded-2xl border border-border shadow-2xl" />
        <div>
          <h1 className="title-bc text-3xl">
            World Cup <span className="text-gradient">Predictor</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Predict every match, place fake-money wagers, climb the table and talk trash with your mates.
          </p>
        </div>
        <Link
          href={loggedIn ? "/dashboard" : "/"}
          className="w-full rounded-2xl bg-[var(--accent)] py-4 text-base font-bold text-black accent-glow active:scale-[0.98]"
        >
          {loggedIn ? "Open the app →" : "Play free — sign up →"}
        </Link>
      </div>
    </div>
  );
}

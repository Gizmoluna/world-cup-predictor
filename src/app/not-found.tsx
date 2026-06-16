import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🧐</div>
      <h1 className="text-xl font-black">Can&apos;t find that</h1>
      <p className="text-sm text-muted">
        This match or page isn&apos;t around — it may have finished or the link&apos;s off.
      </p>
      <Link href="/dashboard" className="rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-black">
        Back to home
      </Link>
    </div>
  );
}

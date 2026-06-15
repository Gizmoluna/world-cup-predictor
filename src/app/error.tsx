"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">😵</div>
      <h1 className="text-xl font-black">Something glitched</h1>
      <p className="text-sm text-muted">
        That page hit a snag. Tap to try again.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-[var(--accent)] px-6 py-3 font-bold text-black"
      >
        Try again
      </button>
      <a href="/dashboard" className="text-sm font-bold text-[var(--accent)]">
        Go to dashboard
      </a>
    </div>
  );
}

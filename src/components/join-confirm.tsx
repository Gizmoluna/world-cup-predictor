"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinLeagueAction } from "@/app/actions";
import { Button } from "./ui/button";

export function JoinConfirm({
  code,
  leagueName,
  userName,
}: {
  code: string;
  leagueName: string;
  userName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function join() {
    setError(null);
    start(async () => {
      const res = await joinLeagueAction(code);
      if (res.ok) router.push("/dashboard");
      else setError(res.error);
    });
  }

  return (
    <div className="glass p-5">
      <p className="text-sm text-muted">
        Signed in as <span className="font-bold text-foreground">{userName}</span>
      </p>
      <Button variant="accent" size="lg" className="mt-4 w-full" disabled={pending} onClick={join}>
        {pending ? "Joining…" : `Join ${leagueName}`}
      </Button>
      {error && <p className="mt-3 text-sm font-bold text-danger">{error}</p>}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLeagueAction } from "@/app/actions";

export function DeleteLeagueButton({
  leagueId,
  name,
}: {
  leagueId: string;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    start(async () => {
      const res = await deleteLeagueAction(leagueId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1 text-[11px] font-bold text-danger/80 hover:text-danger"
      >
        <Trash2 size={12} /> Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-[11px]">
      <span className="text-muted">Delete &ldquo;{name}&rdquo;?</span>
      <button onClick={remove} disabled={pending} className="font-bold text-danger">
        {pending ? "…" : "Yes"}
      </button>
      <button onClick={() => setConfirming(false)} className="font-bold text-muted">
        No
      </button>
      {error && <span className="text-danger">{error}</span>}
    </span>
  );
}

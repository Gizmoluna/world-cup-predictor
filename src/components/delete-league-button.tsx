"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
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
      <Button
        variant="danger"
        size="sm"
        className="w-full"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={14} /> Delete league
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold text-danger">Delete &ldquo;{name}&rdquo; for everyone? This can&apos;t be undone.</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" size="sm" disabled={pending} onClick={remove}>
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

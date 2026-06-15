"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptFriendAction, removeFriendAction } from "@/app/actions";
import { Button } from "./ui/button";

interface Requester {
  id: string;
  name: string;
  flag: string;
}

export function FriendRequests({ requests }: { requests: Requester[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (requests.length === 0) return null;

  function accept(id: string) {
    start(async () => { await acceptFriendAction(id); router.refresh(); });
  }
  function decline(id: string) {
    start(async () => { await removeFriendAction(id); router.refresh(); });
  }

  return (
    <div className="flex flex-col gap-2">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold">{r.flag} {r.name}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="accent" disabled={pending} onClick={() => accept(r.id)}>Accept</Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => decline(r.id)}>Decline</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

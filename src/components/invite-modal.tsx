"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { acceptFriendAction, removeFriendAction } from "@/app/actions";
import { Button } from "./ui/button";

interface Req {
  id: string;
  name: string;
  flag: string;
}

// Pops up the moment a player arrives with pending friend requests, so they can
// accept right away instead of digging into their profile. Shows once per
// browser session (until dismissed or all handled) so it never nags.
export function InviteModal({ requests }: { requests: Req[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Req[]>(requests);

  useEffect(() => {
    setList(requests);
  }, [requests]);

  useEffect(() => {
    if (requests.length === 0) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("invitesDismissed") === "1") return;
    setOpen(true);
  }, [requests]);

  if (!open || list.length === 0) return null;

  function later() {
    sessionStorage.setItem("invitesDismissed", "1");
    setOpen(false);
  }
  function accept(id: string) {
    start(async () => {
      await acceptFriendAction(id);
      setList((l) => l.filter((r) => r.id !== id));
      router.refresh();
    });
  }
  function decline(id: string) {
    start(async () => {
      await removeFriendAction(id);
      setList((l) => l.filter((r) => r.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-2xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus className="text-[var(--accent)]" size={22} />
          <h2 className="title-bc text-xl">
            {list.length} friend request{list.length === 1 ? "" : "s"}
          </h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          {list.length === 1 ? "Someone wants" : "These players want"} to be your friend — accept to
          see each other&apos;s picks and points.
        </p>

        <div className="flex flex-col divide-y divide-border">
          {list.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm font-bold">
                <span className="text-xl">{r.flag}</span>
                <span className="truncate">{r.name}</span>
              </span>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="accent" disabled={pending} onClick={() => accept(r.id)}>
                  Accept
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => decline(r.id)}>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={later}
          className="mt-4 w-full rounded-xl bg-white/8 py-2.5 text-sm font-bold text-muted transition active:scale-[0.99]"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

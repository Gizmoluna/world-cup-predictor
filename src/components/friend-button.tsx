"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { addFriendAction, acceptFriendAction } from "@/app/actions";
import { Button } from "./ui/button";

type State = "friends" | "incoming" | "outgoing" | "none";

export function FriendButton({ targetId, state }: { targetId: string; state: State }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function add() {
    start(async () => { await addFriendAction(targetId); router.refresh(); });
  }
  function accept() {
    start(async () => { await acceptFriendAction(targetId); router.refresh(); });
  }

  if (state === "friends") {
    return (
      <span className="flex items-center gap-1.5 rounded-xl bg-pitch/15 px-3 py-2 text-sm font-bold text-pitch">
        <UserCheck size={16} /> Friends
      </span>
    );
  }
  if (state === "outgoing") {
    return (
      <span className="flex items-center gap-1.5 rounded-xl bg-white/8 px-3 py-2 text-sm font-bold text-muted">
        <Clock size={16} /> Requested
      </span>
    );
  }
  if (state === "incoming") {
    return (
      <Button variant="accent" size="sm" disabled={pending} onClick={accept}>
        <UserCheck size={16} /> Accept friend
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={add}>
      <UserPlus size={16} /> Add friend
    </Button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { challengeFriendAction } from "@/app/actions";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  flag: string;
}

export function DuelChallenge({ matchId, friends }: { matchId: string; friends: Friend[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [opp, setOpp] = useState(friends[0]?.id ?? "");
  const [stake, setStake] = useState(20);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (friends.length === 0) {
    return (
      <div className="glass card-bc p-4 text-sm text-muted">
        ⚔️ Add a friend to wager on the score. (Leagues → Find players)
      </div>
    );
  }

  function challenge() {
    setMsg(null);
    start(async () => {
      const res = await challengeFriendAction(matchId, opp, stake);
      if (res.ok) {
        setMsg({ ok: true, text: "Challenge sent! 💵" });
        setOpen(false);
        router.refresh();
      } else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <div className="glass card-bc p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-left">
        <Swords size={18} className="text-[var(--accent)]" />
        <span className="title-bc text-sm">Duel a friend on the score</span>
        <span className="ml-auto text-xs text-muted">90′ score · {open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <select
            value={opp}
            onChange={(e) => setOpp(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm font-semibold outline-none focus:border-[var(--accent)]"
          >
            {friends.map((f) => (
              <option key={f.id} value={f.id}>{f.flag} {f.name}</option>
            ))}
          </select>
          <div className="flex items-center justify-between">
            <span className="num-bc text-2xl text-pitch">${stake}</span>
            <span className="text-xs text-muted">winner takes ${stake * 2}</span>
          </div>
          <input
            type="range" min={5} max={100} step={5}
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full accent-pitch"
          />
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                className={cn("rounded-lg py-2 text-xs font-bold", stake === v ? "bg-pitch text-black" : "bg-white/8")}
              >
                ${v}
              </button>
            ))}
          </div>
          <Button variant="accent" disabled={pending || !opp} onClick={challenge}>
            Send challenge
          </Button>
        </div>
      )}
      {msg && <p className={cn("mt-2 text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>{msg.text}</p>}
    </div>
  );
}

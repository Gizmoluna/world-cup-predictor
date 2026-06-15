"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { touchStreak } from "@/app/actions";
import { Confetti } from "./confetti";

export function StreakBadge({ initial }: { initial: number }) {
  const [streak, setStreak] = useState(initial);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    touchStreak().then((r) => {
      setStreak(r.streak);
      if (r.milestone) setMilestone(r.milestone);
    });
  }, []);

  if (streak <= 0) return null;

  return (
    <>
      {milestone && <Confetti dedupeKey={`streak-${milestone}`} big sound />}
      <div className="glass card-bc flex items-center gap-3 p-3">
        <Flame className="animate-flame text-gold" size={22} />
        <div className="flex-1">
          <p className="title-bc text-sm">
            {streak}-day streak
            {milestone && <span className="ml-2 text-pitch">🎉 {milestone}-day reward!</span>}
          </p>
          <p className="text-[11px] text-muted">
            {milestone
              ? "Milestone unlocked — keep the run alive!"
              : "Check in daily to keep your streak burning."}
          </p>
        </div>
        <span className="num-bc text-2xl text-gold">{streak}🔥</span>
      </div>
    </>
  );
}

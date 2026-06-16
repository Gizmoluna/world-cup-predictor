import { describe, it, expect } from "vitest";
import { computeAchievements, nextAchievement, type AchievementStat } from "./achievements";

function stat(over: Partial<AchievementStat> = {}): AchievementStat {
  return {
    points: 0, played: 0, exactScores: 0, perfectPicks: 0, matchWins: 0,
    currentStreak: 0, groupCorrect: 0, knockoutPoints: 0, winnings: 0, dailyStreak: 0,
    ...over,
  };
}

describe("computeAchievements progress", () => {
  it("a fresh player has nothing unlocked, all at 0 progress", () => {
    const a = computeAchievements(stat());
    expect(a.every((x) => !x.earned)).toBe(true);
    expect(a.every((x) => x.current === 0 && x.progress === 0)).toBe(true);
  });

  it("clamps current to target and reports remaining", () => {
    const century = computeAchievements(stat({ points: 40 })).find((a) => a.id === "century")!;
    expect(century.current).toBe(40);
    expect(century.target).toBe(100);
    expect(century.remaining).toBe(60);
    expect(century.progress).toBeCloseTo(0.4);
    expect(century.earned).toBe(false);
  });

  it("marks earned and zeroes remaining once the target is hit", () => {
    const first = computeAchievements(stat({ played: 5 })).find((a) => a.id === "first_steps")!;
    expect(first.earned).toBe(true);
    expect(first.remaining).toBe(0);
    expect(first.current).toBe(1); // clamped to target
  });

  it("daily-streak achievement tracks check-in streak", () => {
    const loyal = computeAchievements(stat({ dailyStreak: 4 })).find((a) => a.id === "loyal")!;
    expect(loyal.current).toBe(4);
    expect(loyal.remaining).toBe(3);
  });

  it("a negative match streak floors at 0 (no negative progress)", () => {
    const hot = computeAchievements(stat({ currentStreak: -3 })).find((a) => a.id === "hot_streak")!;
    expect(hot.current).toBe(0);
    expect(hot.progress).toBe(0);
  });
});

describe("nextAchievement", () => {
  it("picks the closest locked achievement", () => {
    // played 19/20 (veteran, 95%) should beat points 1/100 (century, 1%)
    const next = nextAchievement(computeAchievements(stat({ played: 19, points: 1 })));
    expect(next?.id).toBe("veteran");
  });

  it("returns null when everything is unlocked", () => {
    const maxed = stat({
      points: 200, played: 50, exactScores: 10, perfectPicks: 5, matchWins: 20,
      currentStreak: 9, groupCorrect: 5, knockoutPoints: 30, winnings: 200, dailyStreak: 30,
    });
    expect(nextAchievement(computeAchievements(maxed))).toBeNull();
  });
});

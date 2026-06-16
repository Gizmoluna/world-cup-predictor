// ---------------------------------------------------------------------------
// Achievements — computed from a player's aggregate stats. Pure & testable.
// Each carries progress (current/target) so the UI can show "1 away" nudges.
// ---------------------------------------------------------------------------

export interface AchievementStat {
  points: number;
  played: number;
  exactScores: number;
  perfectPicks: number;
  matchWins: number;
  currentStreak: number;
  groupCorrect: number;
  knockoutPoints: number;
  winnings: number;
  dailyStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  earned: boolean;
  current: number; // progress so far (clamped to target)
  target: number;
  progress: number; // 0..1
  remaining: number; // how many more to unlock (0 if earned)
}

interface Def {
  id: string;
  name: string;
  icon: string;
  desc: string;
  value: (s: AchievementStat) => number;
  target: number;
}

const DEFS: Def[] = [
  { id: "first_steps", name: "First Steps", icon: "👶", desc: "Make your first prediction", value: (s) => s.played, target: 1 },
  { id: "crystal_ball", name: "Crystal Ball", icon: "🧊", desc: "Call an exact scoreline", value: (s) => s.exactScores, target: 1 },
  { id: "psychic", name: "Psychic", icon: "🔮", desc: "Land a perfect prediction", value: (s) => s.perfectPicks, target: 1 },
  { id: "group_guru", name: "Group Guru", icon: "🥇", desc: "Nail a group winner", value: (s) => s.groupCorrect, target: 1 },
  { id: "bracket_boss", name: "Bracket Boss", icon: "🗺️", desc: "Score in the knockouts", value: (s) => s.knockoutPoints, target: 1 },
  { id: "hot_streak", name: "Hot Streak", icon: "🔥", desc: "Win 3 matchdays in a row", value: (s) => Math.max(0, s.currentStreak), target: 3 },
  { id: "loyal", name: "Loyal", icon: "📅", desc: "7-day check-in streak", value: (s) => s.dailyStreak, target: 7 },
  { id: "sharpshooter", name: "Sharpshooter", icon: "🎯", desc: "3 exact scores", value: (s) => s.exactScores, target: 3 },
  { id: "high_roller", name: "High Roller", icon: "💰", desc: "Be +$50 on wagers", value: (s) => Math.max(0, s.winnings), target: 50 },
  { id: "inferno", name: "Inferno", icon: "🌋", desc: "Win 5 matchdays in a row", value: (s) => Math.max(0, s.currentStreak), target: 5 },
  { id: "veteran", name: "Veteran", icon: "🎖️", desc: "Predict 20 matches", value: (s) => s.played, target: 20 },
  { id: "legend", name: "Legend", icon: "🏆", desc: "Reach Legend rank (80 pts)", value: (s) => s.points, target: 80 },
  { id: "century", name: "Centurion", icon: "💯", desc: "Reach 100 points", value: (s) => s.points, target: 100 },
];

export function computeAchievements(stat: AchievementStat): Achievement[] {
  return DEFS.map((d) => {
    const raw = d.value(stat);
    const current = Math.max(0, Math.min(raw, d.target));
    const earned = raw >= d.target;
    return {
      id: d.id,
      name: d.name,
      icon: d.icon,
      desc: d.desc,
      earned,
      current,
      target: d.target,
      progress: d.target > 0 ? current / d.target : earned ? 1 : 0,
      remaining: earned ? 0 : d.target - current,
    };
  });
}

/** The locked achievement closest to unlocking — for a "1 away!" nudge. */
export function nextAchievement(achievements: Achievement[]): Achievement | null {
  const locked = achievements.filter((a) => !a.earned);
  if (locked.length === 0) return null;
  return [...locked].sort((a, b) => b.progress - a.progress || a.remaining - b.remaining)[0];
}

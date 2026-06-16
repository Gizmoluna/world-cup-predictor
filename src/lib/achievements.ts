// ---------------------------------------------------------------------------
// Achievements — computed from a player's aggregate stats. Pure & testable.
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
}

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  desc: string;
  earned: boolean;
}

interface Def {
  id: string;
  name: string;
  icon: string;
  desc: string;
  test: (s: AchievementStat) => boolean;
}

const DEFS: Def[] = [
  { id: "first_steps", name: "First Steps", icon: "👶", desc: "Make your first prediction", test: (s) => s.played >= 1 },
  { id: "crystal_ball", name: "Crystal Ball", icon: "🧊", desc: "Call an exact scoreline", test: (s) => s.exactScores >= 1 },
  { id: "psychic", name: "Psychic", icon: "🔮", desc: "Land a perfect prediction", test: (s) => s.perfectPicks >= 1 },
  { id: "hot_streak", name: "Hot Streak", icon: "🔥", desc: "Win 3 matchdays in a row", test: (s) => s.currentStreak >= 3 },
  { id: "inferno", name: "Inferno", icon: "🌋", desc: "Win 5 in a row", test: (s) => s.currentStreak >= 5 },
  { id: "group_guru", name: "Group Guru", icon: "🥇", desc: "Nail a group winner", test: (s) => s.groupCorrect >= 1 },
  { id: "bracket_boss", name: "Bracket Boss", icon: "🗺️", desc: "Score in the knockouts", test: (s) => s.knockoutPoints > 0 },
  { id: "high_roller", name: "High Roller", icon: "💰", desc: "Be +$50 on duels", test: (s) => s.winnings >= 50 },
  { id: "sharpshooter", name: "Sharpshooter", icon: "🎯", desc: "3 exact scores", test: (s) => s.exactScores >= 3 },
  { id: "veteran", name: "Veteran", icon: "🎖️", desc: "Predict 20 matches", test: (s) => s.played >= 20 },
  { id: "century", name: "Centurion", icon: "💯", desc: "Reach 100 points", test: (s) => s.points >= 100 },
  { id: "legend", name: "Legend", icon: "🏆", desc: "Reach Legend rank (80 pts)", test: (s) => s.points >= 80 },
];

export function computeAchievements(stat: AchievementStat): Achievement[] {
  return DEFS.map((d) => ({ id: d.id, name: d.name, icon: d.icon, desc: d.desc, earned: d.test(stat) }));
}

import type { Badge } from "@/lib/types";

// Catalogue of every badge the app can award. The `id` matches the strings
// pushed by calculatePredictionScore + leaderboard-level awards.
export const BADGES: Record<string, Badge> = {
  psychic_mode: {
    id: "psychic_mode",
    name: "Psychic Mode",
    description: "Exact score AND first goal scorer correct.",
    icon: "🔮",
    rarity: "legendary",
  },
  perfect_prediction: {
    id: "perfect_prediction",
    name: "Perfect Prediction",
    description: "Nailed the scoreline and the opening goal.",
    icon: "🎯",
    rarity: "epic",
  },
  exact_score: {
    id: "exact_score",
    name: "Crystal Ball",
    description: "Called the exact final score.",
    icon: "🧊",
    rarity: "rare",
  },
  upset_caller: {
    id: "upset_caller",
    name: "Steal of the Tournament",
    description: "Predicted a major upset — and it landed.",
    icon: "💣",
    rarity: "epic",
  },
  confidence_king: {
    id: "confidence_king",
    name: "Confidence King",
    description: "Cashed in a confidence boost on a winning round.",
    icon: "👑",
    rarity: "rare",
  },
  bottled_it: {
    id: "bottled_it",
    name: "Who Bottled It?",
    description: "Zero points from a match. Ouch.",
    icon: "🚽",
    rarity: "common",
  },
  var_victim: {
    id: "var_victim",
    name: "VAR Victim",
    description: "A VAR call wrecked your prediction.",
    icon: "📺",
    rarity: "common",
  },
  colombian_magic: {
    id: "colombian_magic",
    name: "Colombian Magic",
    description: "Carina's signature winning streak.",
    icon: "🇨🇴",
    rarity: "epic",
  },
  irish_luck: {
    id: "irish_luck",
    name: "Irish Luck",
    description: "Johnny pulled one out of nowhere.",
    icon: "🍀",
    rarity: "epic",
  },
  matchday_king: {
    id: "matchday_king",
    name: "Matchday King",
    description: "Won the day across all of the day's fixtures.",
    icon: "🏆",
    rarity: "rare",
  },
};

export function getBadge(id: string): Badge | undefined {
  return BADGES[id];
}

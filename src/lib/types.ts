// ---------------------------------------------------------------------------
// World Cup Predictor — shared domain types
// ---------------------------------------------------------------------------
// These types are the contract between the football-API providers, the scoring
// engine, the Supabase data layer and the UI. Keep them provider-agnostic.
// ---------------------------------------------------------------------------

export type UserId = string;

export type MatchStatus = "upcoming" | "live" | "full_time" | "postponed";

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type ConfidenceMultiplier = 1 | 2 | 3;

export interface Team {
  id: string;
  apiTeamId?: string | number;
  name: string;
  shortName: string;
  flagUrl: string;
  groupName?: string | null;
  confederation?: string | null;
}

export interface Player {
  id: string;
  apiPlayerId?: string | number;
  teamId: string;
  name: string;
  position?: string | null;
  imageUrl?: string | null;
}

export type MatchEventType =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "penalty_missed"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "var"
  | "shootout_goal"
  | "shootout_miss";

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number | null;
  type: MatchEventType;
  teamId: string | null;
  playerId: string | null;
  assistPlayerId?: string | null;
  description?: string | null;
}

export interface Match {
  id: string;
  apiFixtureId?: string | number;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string; // ISO 8601 UTC
  venue?: string | null;
  stage: MatchStage;
  groupName?: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  htHomeScore?: number | null;
  htAwayScore?: number | null;
  winnerTeamId?: string | null;
  // knockout extras
  extraTime?: boolean;
  shootout?: boolean;
  shootoutWinnerTeamId?: string | null;
  lastSyncedAt?: string | null;
}

/**
 * The full, scored truth of a match once it is finished. Built from a Match +
 * its MatchEvents. This is what the scoring engine compares predictions against.
 */
export interface MatchResult {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  htHomeScore?: number | null;
  htAwayScore?: number | null;
  /** Team id of whoever scored first, or null for 0-0. */
  firstTeamToScoreId: string | null;
  bothTeamsToScore: boolean;
  /** The team that kept a clean sheet, or null if neither did / both did. */
  cleanSheetTeamId: string | null;
  /** null for 0-0. */
  firstGoalScorerId: string | null;
  /** all players who scored (regular + penalty, excludes own goals). */
  goalScorerIds: string[];
  playerOfMatchId: string | null;
  yellowCardPlayerIds: string[];
  redCardOccurred: boolean;
  penaltyAwarded: boolean;
  varDrama: boolean;
  extraTime: boolean;
  shootout: boolean;
  shootoutWinnerTeamId: string | null;
  /** Winner of the match (after ET/pens for knockout), null for a draw. */
  winnerTeamId: string | null;
  /** Optional: pre-match favourite, used for the underdog bonus. */
  favouriteTeamId?: string | null;
}

export interface Prediction {
  id?: string;
  userId: UserId;
  matchId: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  predictedHalfTimeHomeScore?: number | null;
  predictedHalfTimeAwayScore?: number | null;
  predictedWinnerTeamId?: string | null; // null = draw
  firstTeamToScoreId?: string | null;
  bothTeamsToScore?: boolean | null;
  cleanSheetTeamId?: string | null;
  firstGoalScorerId?: string | null;
  anytimeGoalScorerId?: string | null;
  playerOfMatchId?: string | null;
  yellowCardPlayerId?: string | null;
  redCardExpected?: boolean | null;
  penaltyExpected?: boolean | null;
  varDramaExpected?: boolean | null;
  extraTimeExpected?: boolean | null;
  shootoutWinnerTeamId?: string | null;
  confidenceMultiplier?: ConfidenceMultiplier;
  /** Fake-money stake for this match, $0–$100 (allocated per match). */
  wagerAmount?: number | null;
  // fun / flavour picks (no points, just rivalry colour)
  chaosPick?: string | null;
  heartPick?: string | null;
  headPick?: string | null;
  upsetAlert?: boolean | null;
  lockedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PredictionScore {
  predictionId?: string;
  userId: UserId;
  matchId: string;
  exactScorePoints: number;
  resultPoints: number;
  goalDifferencePoints: number;
  totalGoalsPoints: number;
  firstTeamScorePoints: number;
  bttsPoints: number;
  cleanSheetPoints: number;
  firstGoalScorerPoints: number;
  anytimeGoalScorerPoints: number;
  playerOfMatchPoints: number;
  cardPoints: number;
  penaltyPoints: number;
  shootoutPoints: number;
  bonusPoints: number;
  multiplier: number;
  /** Points before the confidence multiplier is applied. */
  subtotal: number;
  totalPoints: number;
  /** Fake-money: amount staked and the profit/loss settled for this match. */
  wagerAmount: number;
  wagerProfit: number;
  badges: string[];
  calculatedAt?: string;
}

export interface AppUser {
  id: UserId;
  name: string;
  email?: string | null;
  flag?: string | null; // emoji flag for arbitrary friends
  avatarUrl?: string | null;
  nationality?: string | null;
  favouriteTeamId?: string | null;
  favouritePlayerId?: string | null;
  theme: string; // theme key, e.g. "carina" | "johnny"
  worldCupWinnerPickId?: string | null;
  goldenBootPickId?: string | null;
  /** Daily check-in streak (consecutive days active). */
  streakCount?: number | null;
  lastActiveDate?: string | null; // yyyy-MM-dd (Melbourne)
  createdAt?: string;
}

export interface League {
  id: string;
  name: string;
  ownerId: UserId;
  inviteCode: string;
  createdAt?: string;
}

export interface LeagueMember {
  leagueId: string;
  userId: UserId;
  joinedAt?: string;
}

export interface GroupPrediction {
  userId: UserId;
  groupName: string;
  teamId: string;
  changeCount?: number;
}

export interface KnockoutPrediction {
  userId: UserId;
  matchId: string;
  teamId: string;
  changeCount?: number;
}

export interface ChatMessage {
  id: string;
  leagueId: string;
  userId: UserId;
  body: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url?: string | null;
  imageUrl?: string | null;
  source: string;
  publishedAt: string;
  teamIds?: string[];
  category: "general" | "injury" | "lineup" | "preview" | "report" | "rumour";
}

export type FactCategory =
  | "live"
  | "record"
  | "history"
  | "player"
  | "host2026"
  | "stat"
  | "rivalry"
  | "trivia";

export interface WorldCupFact {
  id: string;
  text: string;
  category: FactCategory;
  source: string;
  /** true = derived from current tournament data, refreshes as results come in. */
  live?: boolean;
}

export interface Standing {
  teamId: string;
  groupName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rank: number;
}

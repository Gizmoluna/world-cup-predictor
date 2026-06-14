// ---------------------------------------------------------------------------
// Data access layer — users & predictions.
//
// Server-only. When Supabase is configured it is the source of truth (and the
// app works cross-device, which is the whole point: Carina predicts on her
// Samsung, Johnny sees it after kickoff on his iPhone). When it isn't, an
// in-memory demo store keeps the app fully clickable for local dev / preview.
//
// Scores for the leaderboard/battle are computed live from predictions +
// results (see aggregate.ts) — this module only persists the raw inputs.
// ---------------------------------------------------------------------------

import "server-only";
import type { AppUser, Prediction } from "@/lib/types";
import { RIVALS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/server";

// --------------------------------------------------------------------------
// Demo store (module-level, persists for the dev-server lifetime)
// --------------------------------------------------------------------------

const demoUsers = new Map<string, AppUser>(
  RIVALS.map((r) => [
    r.id,
    {
      id: r.id,
      name: r.name,
      theme: r.theme,
      flag: r.flag,
      nationality: r.nationality,
      favouriteTeamId: r.id === "carina" ? "col" : "irl",
      favouritePlayerId: r.id === "carina" ? "col1" : "irl1",
      worldCupWinnerPickId: r.id === "carina" ? "arg" : "fra",
      goldenBootPickId: r.id === "carina" ? "arg1" : "fra1",
    } satisfies AppUser,
  ]),
);

// Pre-seeded predictions for finished matches so the leaderboard/battle are
// alive on first load. Keyed by `${userId}:${matchId}`.
const demoPredictions = new Map<string, Prediction>();

function seedDemoPredictions() {
  if (demoPredictions.size) return;
  const seed: Prediction[] = [
    // f1 ARG 3-1 JPN (actual). Carina nails it; Johnny close.
    { userId: "carina", matchId: "f1", predictedHomeScore: 3, predictedAwayScore: 1, predictedWinnerTeamId: "arg", firstGoalScorerId: "arg1", anytimeGoalScorerId: "arg2", confidenceMultiplier: 2 },
    { userId: "johnny", matchId: "f1", predictedHomeScore: 2, predictedAwayScore: 0, predictedWinnerTeamId: "arg", firstGoalScorerId: "arg2" },
    // f2 COL 2-1 IRL. Carina backs Colombia; Johnny backs Ireland (heart pick).
    { userId: "carina", matchId: "f2", predictedHomeScore: 2, predictedAwayScore: 1, predictedWinnerTeamId: "col", firstGoalScorerId: "col1", confidenceMultiplier: 3 },
    { userId: "johnny", matchId: "f2", predictedHomeScore: 1, predictedAwayScore: 2, predictedWinnerTeamId: "irl", firstGoalScorerId: "irl1", heartPick: "Ireland to shock Colombia" },
    // f3 BRA 4-0 AUS.
    { userId: "carina", matchId: "f3", predictedHomeScore: 3, predictedAwayScore: 0, predictedWinnerTeamId: "bra", firstGoalScorerId: "bra1" },
    { userId: "johnny", matchId: "f3", predictedHomeScore: 2, predictedAwayScore: 1, predictedWinnerTeamId: "bra", anytimeGoalScorerId: "bra1" },
    // f4 ENG 1-1 GER (red card).
    { userId: "carina", matchId: "f4", predictedHomeScore: 2, predictedAwayScore: 1, predictedWinnerTeamId: "eng", redCardExpected: false },
    { userId: "johnny", matchId: "f4", predictedHomeScore: 1, predictedAwayScore: 1, redCardExpected: true, firstGoalScorerId: "eng1", confidenceMultiplier: 2 },
  ];
  const now = new Date().toISOString();
  for (const p of seed) {
    demoPredictions.set(`${p.userId}:${p.matchId}`, { ...p, lockedAt: now, createdAt: now, updatedAt: now });
  }
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

export async function getUsers(): Promise<AppUser[]> {
  if (!isSupabaseConfigured()) return [...demoUsers.values()];
  const sb = createServiceClient();
  const { data } = await sb.from("users").select("*").order("created_at");
  return (data ?? []).map(rowToUser);
}

export async function getUser(id: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return demoUsers.get(id) ?? null;
  const sb = createServiceClient();
  const { data } = await sb.from("users").select("*").eq("id", id).maybeSingle();
  return data ? rowToUser(data) : null;
}

export async function updateUser(id: string, patch: Partial<AppUser>): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) {
    const u = demoUsers.get(id);
    if (!u) return null;
    Object.assign(u, patch);
    return u;
  }
  const sb = createServiceClient();
  const { data } = await sb.from("users").update(userToRow(patch)).eq("id", id).select().maybeSingle();
  return data ? rowToUser(data) : null;
}

/** Create-or-update a user profile (auth bootstrap + new friends). */
export async function ensureUser(user: AppUser): Promise<AppUser> {
  if (!isSupabaseConfigured()) {
    const existing = demoUsers.get(user.id);
    const merged = { ...existing, ...user } as AppUser;
    demoUsers.set(user.id, merged);
    return merged;
  }
  const sb = createServiceClient();
  const { data } = await sb
    .from("users")
    .upsert({ id: user.id, ...userToRow(user) }, { onConflict: "id" })
    .select()
    .maybeSingle();
  return data ? rowToUser(data) : user;
}

export async function getAllPredictions(): Promise<Prediction[]> {
  if (!isSupabaseConfigured()) {
    seedDemoPredictions();
    return [...demoPredictions.values()];
  }
  const sb = createServiceClient();
  const { data } = await sb.from("predictions").select("*");
  return (data ?? []).map(rowToPrediction);
}

export async function getPredictionsForMatch(matchId: string): Promise<Prediction[]> {
  return (await getAllPredictions()).filter((p) => p.matchId === matchId);
}

export async function getUserPrediction(userId: string, matchId: string): Promise<Prediction | null> {
  return (await getAllPredictions()).find((p) => p.userId === userId && p.matchId === matchId) ?? null;
}

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  return (await getAllPredictions()).filter((p) => p.userId === userId);
}

/** Upsert a prediction. Caller is responsible for enforcing the kickoff lock. */
export async function savePrediction(p: Prediction): Promise<Prediction> {
  const now = new Date().toISOString();
  const record: Prediction = { ...p, updatedAt: now, createdAt: p.createdAt ?? now };
  if (!isSupabaseConfigured()) {
    seedDemoPredictions();
    demoPredictions.set(`${p.userId}:${p.matchId}`, record);
    return record;
  }
  const sb = createServiceClient();
  const { data } = await sb
    .from("predictions")
    .upsert(predictionToRow(record), { onConflict: "user_id,match_id" })
    .select()
    .maybeSingle();
  return data ? rowToPrediction(data) : record;
}

// --------------------------------------------------------------------------
// Row mappers (snake_case <-> camelCase)
// --------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToUser(r: any): AppUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    flag: r.flag,
    avatarUrl: r.avatar_url,
    nationality: r.nationality,
    favouriteTeamId: r.favourite_team_id,
    favouritePlayerId: r.favourite_player_id,
    theme: r.theme ?? "carina",
    worldCupWinnerPickId: r.world_cup_winner_pick_id,
    goldenBootPickId: r.golden_boot_pick_id,
    createdAt: r.created_at,
  };
}

function userToRow(u: Partial<AppUser>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (u.name !== undefined) row.name = u.name;
  if (u.email !== undefined) row.email = u.email;
  if (u.flag !== undefined) row.flag = u.flag;
  if (u.avatarUrl !== undefined) row.avatar_url = u.avatarUrl;
  if (u.nationality !== undefined) row.nationality = u.nationality;
  if (u.favouriteTeamId !== undefined) row.favourite_team_id = u.favouriteTeamId;
  if (u.favouritePlayerId !== undefined) row.favourite_player_id = u.favouritePlayerId;
  if (u.theme !== undefined) row.theme = u.theme;
  if (u.worldCupWinnerPickId !== undefined) row.world_cup_winner_pick_id = u.worldCupWinnerPickId;
  if (u.goldenBootPickId !== undefined) row.golden_boot_pick_id = u.goldenBootPickId;
  return row;
}

function rowToPrediction(r: any): Prediction {
  return {
    id: r.id,
    userId: r.user_id,
    matchId: r.match_id,
    predictedHomeScore: r.predicted_home_score,
    predictedAwayScore: r.predicted_away_score,
    predictedHalfTimeHomeScore: r.predicted_half_time_home_score,
    predictedHalfTimeAwayScore: r.predicted_half_time_away_score,
    predictedWinnerTeamId: r.predicted_winner_team_id,
    firstTeamToScoreId: r.first_team_to_score_id,
    bothTeamsToScore: r.both_teams_to_score,
    cleanSheetTeamId: r.clean_sheet_team_id,
    firstGoalScorerId: r.first_goal_scorer_id,
    anytimeGoalScorerId: r.anytime_goal_scorer_id,
    playerOfMatchId: r.player_of_match_id,
    yellowCardPlayerId: r.yellow_card_player_id,
    redCardExpected: r.red_card_expected,
    penaltyExpected: r.penalty_expected,
    varDramaExpected: r.var_drama_expected,
    extraTimeExpected: r.extra_time_expected,
    shootoutWinnerTeamId: r.shootout_winner_team_id,
    confidenceMultiplier: r.confidence_multiplier ?? 1,
    chaosPick: r.chaos_pick,
    heartPick: r.heart_pick,
    headPick: r.head_pick,
    upsetAlert: r.upset_alert,
    lockedAt: r.locked_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function predictionToRow(p: Prediction): Record<string, unknown> {
  return {
    ...(p.id ? { id: p.id } : {}),
    user_id: p.userId,
    match_id: p.matchId,
    predicted_home_score: p.predictedHomeScore,
    predicted_away_score: p.predictedAwayScore,
    predicted_half_time_home_score: p.predictedHalfTimeHomeScore ?? null,
    predicted_half_time_away_score: p.predictedHalfTimeAwayScore ?? null,
    predicted_winner_team_id: p.predictedWinnerTeamId ?? null,
    first_team_to_score_id: p.firstTeamToScoreId ?? null,
    both_teams_to_score: p.bothTeamsToScore ?? null,
    clean_sheet_team_id: p.cleanSheetTeamId ?? null,
    first_goal_scorer_id: p.firstGoalScorerId ?? null,
    anytime_goal_scorer_id: p.anytimeGoalScorerId ?? null,
    player_of_match_id: p.playerOfMatchId ?? null,
    yellow_card_player_id: p.yellowCardPlayerId ?? null,
    red_card_expected: p.redCardExpected ?? null,
    penalty_expected: p.penaltyExpected ?? null,
    var_drama_expected: p.varDramaExpected ?? null,
    extra_time_expected: p.extraTimeExpected ?? null,
    shootout_winner_team_id: p.shootoutWinnerTeamId ?? null,
    confidence_multiplier: p.confidenceMultiplier ?? 1,
    chaos_pick: p.chaosPick ?? null,
    heart_pick: p.heartPick ?? null,
    head_pick: p.headPick ?? null,
    upset_alert: p.upsetAlert ?? null,
    locked_at: p.lockedAt ?? null,
    updated_at: p.updatedAt ?? new Date().toISOString(),
  };
}

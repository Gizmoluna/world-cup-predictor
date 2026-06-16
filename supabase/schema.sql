-- ===========================================================================
-- World Cup Predictor — Supabase setup (schema + seed, run once)
-- Match/team/player data comes live from the data provider, so the DB only
-- persists users, predictions, scores, leagues and badges. Cross-entity
-- foreign keys are intentionally omitted (those reference live, not-stored
-- data); integrity is handled in the app. RLS is on with no public policies —
-- the app uses the service-role key (which bypasses RLS); the public anon key
-- gets no direct access.
-- ===========================================================================

create extension if not exists "pgcrypto";

create table if not exists teams (
  id text primary key,
  api_team_id text,
  name text not null,
  short_name text,
  flag_url text,
  group_name text,
  confederation text
);

create table if not exists players (
  id text primary key,
  api_player_id text,
  team_id text,
  name text not null,
  position text,
  image_url text
);

create table if not exists users (
  id text primary key,
  name text not null,
  email text,
  flag text,
  avatar_url text,
  nationality text,
  home_country text,
  adopted_country text,
  favourite_country text,
  favourite_team_id text,
  favourite_player_id text,
  theme text not null default 'gold',
  world_cup_winner_pick_id text,
  golden_boot_pick_id text,
  pin_hash text,
  streak_count int not null default 0,
  last_active_date text,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id text primary key,
  api_fixture_id text,
  home_team_id text,
  away_team_id text,
  kickoff_at timestamptz,
  venue text,
  stage text default 'group',
  group_name text,
  status text default 'upcoming',
  home_score int,
  away_score int,
  winner_team_id text,
  last_synced_at timestamptz
);

create table if not exists match_events (
  id text primary key,
  match_id text,
  minute int,
  type text,
  team_id text,
  player_id text,
  assist_player_id text,
  description text
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  match_id text not null,
  predicted_home_score int,
  predicted_away_score int,
  predicted_half_time_home_score int,
  predicted_half_time_away_score int,
  predicted_winner_team_id text,
  first_team_to_score_id text,
  both_teams_to_score boolean,
  clean_sheet_team_id text,
  first_goal_scorer_id text,
  anytime_goal_scorer_id text,
  player_of_match_id text,
  yellow_card_player_id text,
  red_card_expected boolean,
  penalty_expected boolean,
  var_drama_expected boolean,
  extra_time_expected boolean,
  shootout_winner_team_id text,
  confidence_multiplier int not null default 1,
  wager_amount int not null default 0,
  chaos_pick text,
  heart_pick text,
  head_pick text,
  upset_alert boolean,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create table if not exists prediction_scores (
  id uuid primary key default gen_random_uuid(),
  prediction_id uuid,
  user_id text not null,
  match_id text not null,
  exact_score_points int default 0,
  result_points int default 0,
  goal_difference_points int default 0,
  total_goals_points int default 0,
  first_team_score_points int default 0,
  btts_points int default 0,
  clean_sheet_points int default 0,
  first_goal_scorer_points int default 0,
  anytime_goal_scorer_points int default 0,
  player_of_match_points int default 0,
  card_points int default 0,
  penalty_points int default 0,
  shootout_points int default 0,
  bonus_points int default 0,
  multiplier int default 1,
  total_points int default 0,
  calculated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create table if not exists badges (
  id text primary key,
  name text not null,
  description text,
  icon text,
  rarity text
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  badge_id text,
  match_id text,
  awarded_at timestamptz not null default now()
);

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id text,
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists league_members (
  league_id text not null,
  user_id text not null,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  league_id text not null,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists group_predictions (
  user_id text not null,
  group_name text not null,
  team_id text not null,
  change_count int not null default 0,
  penalty int not null default 0,
  primary key (user_id, group_name)
);

create table if not exists knockout_predictions (
  user_id text not null,
  match_id text not null,
  team_id text not null,
  method text,
  change_count int not null default 0,
  penalty int not null default 0,
  primary key (user_id, match_id)
);

create table if not exists group_orders (
  user_id text not null,
  group_name text not null,
  team_ids text not null,
  change_count int not null default 0,
  penalty int not null default 0,
  primary key (user_id, group_name)
);

create table if not exists wager_duels (
  id uuid primary key default gen_random_uuid(),
  match_id text not null,
  challenger_id text not null,
  opponent_id text not null,
  stake int not null default 10,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists friend_requests (
  from_user text not null,
  to_user text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (from_user, to_user)
);

create table if not exists join_requests (
  league_id text not null,
  user_id text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists predictions_match_idx on predictions(match_id);
create index if not exists predictions_user_idx on predictions(user_id);
create index if not exists messages_league_idx on messages(league_id, created_at);
create index if not exists league_members_league_idx on league_members(league_id);
create index if not exists prediction_scores_user_idx on prediction_scores(user_id);
create index if not exists group_predictions_user_idx on group_predictions(user_id);
create index if not exists knockout_predictions_user_idx on knockout_predictions(user_id);
create index if not exists join_requests_league_idx on join_requests(league_id);
create index if not exists friend_requests_to_idx on friend_requests(to_user);
create index if not exists friend_requests_from_idx on friend_requests(from_user);
create index if not exists wager_duels_challenger_idx on wager_duels(challenger_id);
create index if not exists wager_duels_opponent_idx on wager_duels(opponent_id);
create index if not exists wager_duels_match_idx on wager_duels(match_id);
create index if not exists league_members_user_idx on league_members(user_id);

-- RLS on, no public policies (service-role key bypasses it).
alter table teams enable row level security;
alter table players enable row level security;
alter table users enable row level security;
alter table matches enable row level security;
alter table match_events enable row level security;
alter table predictions enable row level security;
alter table prediction_scores enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table messages enable row level security;
alter table group_predictions enable row level security;
alter table knockout_predictions enable row level security;
alter table group_orders enable row level security;
alter table join_requests enable row level security;
alter table friend_requests enable row level security;
alter table wager_duels enable row level security;
alter table push_subscriptions enable row level security;

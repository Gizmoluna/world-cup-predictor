-- ===========================================================================
-- Carina vs Johnny: World Cup Clash — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- core reference -------------------------------------------------------

create table if not exists teams (
  id            text primary key,
  api_team_id   text,
  name          text not null,
  short_name    text not null,
  flag_url      text,
  group_name    text,
  confederation text
);

create table if not exists players (
  id           text primary key,
  api_player_id text,
  team_id      text references teams(id) on delete set null,
  name         text not null,
  position     text,
  image_url    text
);

-- --- users ----------------------------------------------------------------
-- id is the app user key ("carina"/"johnny" today; a uuid per friend later).
create table if not exists users (
  id                     text primary key,
  name                   text not null,
  avatar_url             text,
  nationality            text,
  favourite_team_id      text references teams(id) on delete set null,
  favourite_player_id    text references players(id) on delete set null,
  theme                  text not null default 'carina',
  world_cup_winner_pick_id text references teams(id) on delete set null,
  golden_boot_pick_id    text references players(id) on delete set null,
  pin_hash               text,
  created_at             timestamptz not null default now()
);

-- --- matches & events -----------------------------------------------------

create table if not exists matches (
  id             text primary key,
  api_fixture_id text,
  home_team_id   text references teams(id),
  away_team_id   text references teams(id),
  kickoff_at     timestamptz not null,
  venue          text,
  stage          text not null default 'group',
  group_name     text,
  status         text not null default 'upcoming',
  home_score     int,
  away_score     int,
  winner_team_id text references teams(id),
  last_synced_at timestamptz
);
create index if not exists matches_kickoff_idx on matches(kickoff_at);
create index if not exists matches_status_idx on matches(status);

create table if not exists match_events (
  id               text primary key,
  match_id         text references matches(id) on delete cascade,
  minute           int,
  type             text not null,
  team_id          text,
  player_id        text,
  assist_player_id text,
  description      text
);
create index if not exists match_events_match_idx on match_events(match_id);

-- --- predictions ----------------------------------------------------------

create table if not exists predictions (
  id                            uuid primary key default gen_random_uuid(),
  user_id                       text references users(id) on delete cascade,
  match_id                      text references matches(id) on delete cascade,
  predicted_home_score          int,
  predicted_away_score          int,
  predicted_half_time_home_score int,
  predicted_half_time_away_score int,
  predicted_winner_team_id      text,
  first_team_to_score_id        text,
  both_teams_to_score           boolean,
  clean_sheet_team_id           text,
  first_goal_scorer_id          text,
  anytime_goal_scorer_id        text,
  player_of_match_id            text,
  yellow_card_player_id         text,
  red_card_expected             boolean,
  penalty_expected              boolean,
  var_drama_expected            boolean,
  extra_time_expected           boolean,
  shootout_winner_team_id       text,
  confidence_multiplier         int not null default 1,
  chaos_pick                    text,
  heart_pick                    text,
  head_pick                     text,
  upset_alert                   boolean,
  locked_at                     timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  unique (user_id, match_id)
);
create index if not exists predictions_match_idx on predictions(match_id);

create table if not exists prediction_scores (
  id                         uuid primary key default gen_random_uuid(),
  prediction_id              uuid references predictions(id) on delete cascade,
  user_id                    text references users(id) on delete cascade,
  match_id                   text references matches(id) on delete cascade,
  exact_score_points         int default 0,
  result_points              int default 0,
  goal_difference_points     int default 0,
  total_goals_points         int default 0,
  first_team_score_points    int default 0,
  btts_points                int default 0,
  clean_sheet_points         int default 0,
  first_goal_scorer_points   int default 0,
  anytime_goal_scorer_points int default 0,
  player_of_match_points     int default 0,
  card_points                int default 0,
  penalty_points             int default 0,
  shootout_points            int default 0,
  bonus_points               int default 0,
  multiplier                 int default 1,
  total_points               int default 0,
  calculated_at              timestamptz not null default now(),
  unique (user_id, match_id)
);

-- --- badges ---------------------------------------------------------------

create table if not exists badges (
  id          text primary key,
  name        text not null,
  description text,
  icon        text,
  rarity      text
);

create table if not exists user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    text references users(id) on delete cascade,
  badge_id   text references badges(id) on delete cascade,
  match_id   text references matches(id) on delete set null,
  awarded_at timestamptz not null default now()
);

-- --- leagues (friends play in private leagues via invite code) -------------

create table if not exists leagues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    text references users(id) on delete set null,
  invite_code text unique not null,
  created_at  timestamptz not null default now()
);

create table if not exists league_members (
  league_id text references leagues(id) on delete cascade,
  user_id   text references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);
create index if not exists league_members_user_idx on league_members(user_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
-- Reference data is world-readable; writes happen via the server (service role,
-- which bypasses RLS). When real per-friend Supabase Auth is added, tighten the
-- predictions/users policies to `auth.uid()::text = user_id`.

alter table teams enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_events enable row level security;
alter table users enable row level security;
alter table predictions enable row level security;
alter table prediction_scores enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;

do $$
begin
  -- public read for reference + (already-locked) competitive data
  perform 1; -- (policies below are idempotent via drop/create)
end $$;

drop policy if exists "public read teams" on teams;
create policy "public read teams" on teams for select using (true);
drop policy if exists "public read players" on players;
create policy "public read players" on players for select using (true);
drop policy if exists "public read matches" on matches;
create policy "public read matches" on matches for select using (true);
drop policy if exists "public read match_events" on match_events;
create policy "public read match_events" on match_events for select using (true);
drop policy if exists "public read users" on users;
create policy "public read users" on users for select using (true);
drop policy if exists "public read scores" on prediction_scores;
create policy "public read scores" on prediction_scores for select using (true);
drop policy if exists "public read badges" on badges;
create policy "public read badges" on badges for select using (true);
drop policy if exists "public read user_badges" on user_badges;
create policy "public read user_badges" on user_badges for select using (true);
drop policy if exists "public read leagues" on leagues;
create policy "public read leagues" on leagues for select using (true);
drop policy if exists "public read league_members" on league_members;
create policy "public read league_members" on league_members for select using (true);

-- Predictions: readable only once the match has kicked off (hide opponent
-- picks pre-kickoff). Server uses the service role for the owner's own writes.
drop policy if exists "read locked predictions" on predictions;
create policy "read locked predictions" on predictions for select
  using (
    exists (
      select 1 from matches m
      where m.id = predictions.match_id and m.kickoff_at <= now()
    )
  );

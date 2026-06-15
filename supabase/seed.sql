-- Seed the two rivals + badge catalogue. Run after schema.sql.
-- Teams/players/matches are populated by the app's /api/sync/fixtures job.

insert into users (id, name, theme, nationality, flag) values
  ('carina', 'Carina', 'gold', 'Colombia', '🇨🇴'),
  ('johnny', 'Johnny', 'emerald', 'Ireland', '🍀')
on conflict (id) do nothing;

-- The starter league everyone can join.
insert into leagues (id, name, owner_id, invite_code) values
  ('00000000-0000-0000-0000-000000000001', 'Friends League', 'carina', 'CLASH26')
on conflict (id) do nothing;
insert into league_members (league_id, user_id) values
  ('00000000-0000-0000-0000-000000000001', 'carina'),
  ('00000000-0000-0000-0000-000000000001', 'johnny')
on conflict do nothing;

insert into badges (id, name, description, icon, rarity) values
  ('psychic_mode',     'Psychic Mode',           'Exact score AND first goal scorer correct.', '🔮', 'legendary'),
  ('perfect_prediction','Perfect Prediction',    'Nailed the scoreline and the opening goal.', '🎯', 'epic'),
  ('exact_score',      'Crystal Ball',           'Called the exact final score.', '🧊', 'rare'),
  ('upset_caller',     'Steal of the Tournament','Predicted a major upset — and it landed.', '💣', 'epic'),
  ('confidence_king',  'Confidence King',        'Cashed in a confidence boost on a winning round.', '👑', 'rare'),
  ('bottled_it',       'Who Bottled It?',        'Zero points from a match. Ouch.', '🚽', 'common'),
  ('var_victim',       'VAR Victim',             'A VAR call wrecked your prediction.', '📺', 'common'),
  ('colombian_magic',  'Colombian Magic',        'Carina''s signature winning streak.', '🇨🇴', 'epic'),
  ('irish_luck',       'Irish Luck',             'Johnny pulled one out of nowhere.', '🍀', 'epic'),
  ('matchday_king',    'Matchday King',          'Won the day across all of the day''s fixtures.', '🏆', 'rare')
on conflict (id) do nothing;

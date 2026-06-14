# Friends & Leagues — BUILT

> Requested: *"Carina wants to let her friends use the app for leagues with them."*
> Decisions: **real accounts (Supabase Auth)**, **private leagues + invite codes**, build now.

## Status — shipped ✅

- **Real accounts**: Supabase Auth (email magic-link + Google) on the login screen
  when Supabase is configured; the tap-to-login demo path remains when it isn't.
  Profiles auto-bootstrap on first sign-in (`getCurrentUser`). Session refresh via
  `middleware.ts`; OAuth/magic-link land on `/auth/callback`.
- **Private leagues + invite codes**: `/leagues` page — create a league (gets a
  6-char code), join by code, copy/share code, switch active league (header
  switcher). `leagues` + `league_members` tables in `supabase/schema.sql`.
- **League-scoped everything**: dashboard, matches, leaderboard, battle and match
  detail all scope to the active league's members (`getReadModel({restrictUserIds})`).
  The battle/score views generalised from the hardcoded 2-rival layout to any N
  players via `src/lib/display.ts::chrome()`.
- **Predictions stay global per user** — one prediction per match, counted in every
  league the user is in. Leagues only slice the leaderboard.

> ⚠️ The Supabase Auth path is wired and type/build-checked but needs a live
> Supabase project to exercise end-to-end (magic-link email, Google OAuth). The
> in-memory demo path (OG league seeded) is fully verified locally.

---

## Original design notes

The current app is a 1-v-1 Carina-vs-Johnny rivalry. The data model is already
per-user (`users`, `predictions`, `prediction_scores` are all keyed by `user_id`),
so extending to many players + private leagues is additive, not a rewrite.

## What changes

1. **Real accounts** — friends need to sign in from their own phones. The current
   "tap Carina / tap Johnny" device-cookie login works for two known people but
   not for an open friend list. Add Supabase Auth (email magic-link or Google).
   Carina & Johnny keep their themes; new users pick a name + flag/theme.

2. **Leagues** — a `leagues` table + `league_members` join table. A league has an
   owner, a name, and a short **invite code** (shareable link). Friends join via
   the code. A user can be in several leagues.

3. **Predictions stay global per user** — one prediction per user per match,
   counted in *every* league they're in. Leagues only *slice* the leaderboard;
   they don't fork predictions. (Simplest, and how Superbru/Fantasy work.)

4. **League-scoped views** — leaderboard, battle (still works head-to-head for
   2-person leagues; becomes a table for 3+), and stats gain a league switcher.
   The "Carina vs Johnny" battle page becomes "this league's clash".

## Proposed schema additions

```sql
create table leagues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    text references users(id),
  invite_code text unique not null,
  created_at  timestamptz default now()
);
create table league_members (
  league_id text references leagues(id) on delete cascade,
  user_id   text references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (league_id, user_id)
);
```

`getReadModel()` already builds leaderboards from any user set —
`buildLeaderboard(users, scoredMatches)` just needs the league's member list
instead of all users. Minimal change.

## Open decisions (confirm before building)

- **Sign-in friction vs security**: lightweight (name + invite link, optional PIN)
  vs proper accounts (Supabase Auth email/Google).
- **League shape**: one shared league for everyone, or multiple private leagues
  with invite codes (recommended).
- **Build now vs after the 1-v-1 app is in their hands.**

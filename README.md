# Carina vs Johnny: World Cup Clash ⚽🏆

> Carina vs Johnny. Every match. Every prediction. Glory forever.

A mobile-first PWA where **Carina** 🇨🇴 and **Johnny** 🇮🇪 predict World Cup matches —
scorelines, goal scorers, cards, bonuses — and the app auto-scores every prediction
and tracks the head-to-head rivalry.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

It runs **immediately with zero config** — demo mode ships with seed fixtures
(finished, live and upcoming), real teams/players, sample news, and pre-seeded
predictions so the leaderboard and battle page are alive on first load.

```bash
npm test           # scoring-engine unit tests (21 tests)
npm run build      # production build
```

## How it works

| Layer | Where |
|---|---|
| **Scoring engine** (pure, unit-tested) | `src/lib/scoring/calculatePredictionScore.ts` |
| **Football data abstraction** (swappable provider) | `src/lib/football-api/provider.ts` |
| **Read model** (live leaderboard/battle/scores) | `src/lib/aggregate.ts` |
| **Data layer** (Supabase or in-memory demo) | `src/lib/data.ts` |
| **Sync + scoring jobs** | `src/lib/sync.ts` → `/api/sync/*`, `/api/score` |

The app **never calls a vendor API from the client** — all data flows through the
provider interface in server code.

### Scoring (configurable in `src/lib/scoring/points.ts`)

Exact score **+5**, correct result **+2**, GD/total goals **+1** each, first team to
score / BTTS / clean sheet **+1**, first goal scorer **+4**, anytime scorer **+2**,
player of the match **+3**, red card **+3**, penalty **+2**, shootout winner **+3**.
Confidence boost (1×/2×/3×) multiplies the match total. Perfect-prediction and
underdog bonuses + badges on top.

## Going live (cross-device)

Demo mode is single-device (in-memory). For Carina and Johnny to play from their
own phones, add **Supabase**:

1. Create a Supabase project.
2. Run `supabase/schema.sql` then `supabase/seed.sql` in the SQL editor.
3. Set env (`cp .env.local.example .env.local`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Real fixtures

Set `FOOTBALL_PROVIDER=api-football` + `API_FOOTBALL_KEY` (api-sports.io, World Cup
= league `1`). Other providers (SportMonks / Statorium / worldcupapi) slot into the
same interface in `src/lib/football-api/`. Without a key it falls back to seed data.

## Deploy (Vercel)

1. Push to GitHub, import to Vercel, add the env vars.
2. `vercel.json` registers cron jobs: fixtures (6h), live (1m), standings (10m),
   news (30m), scoring (5m). Set a `CRON_SECRET` env var — Vercel sends it as a
   Bearer token, which `/api/sync/*` and `/api/score` verify.
   *(Per-minute crons need the Vercel Pro plan; live data is also fetched
   on-request with a 60s revalidate, so freshness holds without it.)*

## PWA / mobile

Installable (Add to Home Screen), offline app-shell service worker
(`public/sw.js`), iOS/Android safe-area handling, bottom tab nav, big
thumb-friendly controls. Tested layout target: iPhone Safari + Samsung Chrome.

## Pages

`/` login · `/dashboard` · `/matches` · `/matches/[id]` (predict / locked view) ·
`/battle` · `/leaderboard` · `/profile/[id]` · `/news` · `/stats` · `/settings` ·
`/admin` (manual sync / score / CSV export).

## Adding more players / leagues

`users`, `predictions` and scoring are already per-user — the model supports more
than two players. A friends-leagues layer (invites, multiple private leagues,
per-league tables) is the planned next step — see `LEAGUES.md`.

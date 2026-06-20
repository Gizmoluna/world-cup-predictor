# Deploy — get friends playing

Repo: https://github.com/Gizmoluna/world-cup-predictor (private)
Stack: Supabase (database) + Vercel (hosting). Auth is in-app (name + PIN), so
**no Supabase Auth setup is needed** — Supabase is just the database.

There are 3 things only you can do (they need your logins). ~15 minutes.

---

## 1. Supabase (database) — ~5 min

1. Go to https://supabase.com → **New project** (free tier). Pick a name + a DB
   password, choose a region near Australia (e.g. Sydney).
2. When it's ready, open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), click **Run**.
3. New query again, paste [`supabase/seed.sql`](supabase/seed.sql), **Run**.
   (Seeds Carina + Johnny + the OG league + badges.)
4. **Project Settings → API**, copy these three values for step 3:
   - Project URL  → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Live match data — no key needed ✅

Set `FOOTBALL_PROVIDER=espn` (in step 3). This uses ESPN's free public feed for
real World Cup fixtures, scores, results, goal scorers and cards — **no signup,
no API key**. (Optional: for more complete player stats you can later switch to
`api-football` with a free api-sports.io key, but `espn` is plenty.)

## 3. Vercel (hosting) — ~5 min

1. Go to https://vercel.com → **Add New → Project → Import Git Repository** and
   pick `Gizmoluna/world-cup-predictor` (authorize GitHub if asked).
2. Framework auto-detects **Next.js**. Before deploying, add **Environment
   Variables** (Production) — paste these:

   ```
   SESSION_SECRET=37132159eed5834158db8dd36c26d91c1aaa579a5f978d059ec2a8d8036f3879
   CRON_SECRET=915218972c977c15ff29994ee6b2fd8a87cd6462d28d56f6
   FOOTBALL_PROVIDER=espn
   NEXT_PUBLIC_SUPABASE_URL=<from step 1>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from step 1>
   SUPABASE_SERVICE_ROLE_KEY=<from step 1>
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPXAp3DlNH108wQkKNBmCLwixIpol7iAkkx_axWR56zSJKHZkx9URFF7JQShnGb1dKJOdGuuePSvfSBqk1yE4BY
   VAPID_PRIVATE_KEY=-xq2Qt-rX5rxRvPBjb34bcWi0_aGZGSk8kY6kuSA8_8
   VAPID_SUBJECT=mailto:johnardara@gmail.com
   RESEND_API_KEY=<from resend.com — optional, for password-reset emails>
   ANTHROPIC_API_KEY=<from console.anthropic.com — optional, for AI previews & banter>
   ```
   > **Password-reset emails** need `RESEND_API_KEY` (free at resend.com). Without
   > it the reset flow still works but shows the link on-screen instead of emailing
   > it. Also re-run `supabase/schema.sql` once — it adds the `password_resets`
   > table (idempotent, never drops data).
   > These secrets were generated for you; keep them private. Regenerate the
   > session/cron secrets with `openssl rand -hex 32`, the VAPID push keys with
   > `npx web-push generate-vapid-keys`.
   > **Push notifications** (friend requests, duel challenges, pots, spy alerts)
   > only fire once the three `VAPID_*` vars are set — without them the app runs
   > fine but stays silent.

3. **Deploy**. You'll get a URL like `https://world-cup-predictor.vercel.app`.
4. Data is fetched **live on every visit** (≤60s fresh), so no cron is required.
   `vercel.json` adds one **daily** score-persistence cron (Hobby-plan friendly).
   On Vercel Pro you can restore the more frequent crons in git history.

---

## 4. Share with friends

- Send them the Vercel URL. On iPhone Safari / Android Chrome: **Share → Add to
  Home Screen** for the full-screen app.
- Everyone taps **Sign up**, picks a name + flag + PIN, and they're in.
- Make a league (`Leagues` tab) and share the invite code, or have them join the
  OG `CLASH26` league.

## First sign-in for you two

Carina and Johnny already exist (with all the sample predictions). Tap **Log in**,
pick your name, and the **first PIN you enter claims the account**.

# Go-live checklist — the 3 things only you can do

The app code is done and deploying. These three steps need your logins (I can't
do them without access). ~15 minutes total. Do them in order.

---

## 1. Supabase — apply the database (fixes spying + connects you & Carina)

In your Supabase project → **SQL Editor**:

1. **New query** → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   - Idempotent (safe to re-run). Includes the `spy_reveals` table — this is what
     makes the 🕵️ spy feature work instead of erroring.
2. **New query** → paste [`supabase/seed.sql`](supabase/seed.sql) → **Run**.
   - Seeds Carina, Johnny, the **"Carina vs Johnny" league**, and the badges.

✅ After this: you two **share a league automatically** — no CLASH26 join needed.
That single fact unlocks head-to-head, spying, the derby, and league pots.

> Already had an older schema applied? Re-running `schema.sql` only **adds**
> what's missing (e.g. `spy_reveals`) — it never drops your data.

---

## 2. Vercel — point your URL at the real app (fixes "I can't see the new build")

There are **two** Vercel projects wired to the repo, which is why the deploy
"doesn't show". Clean it up:

1. Vercel → your team → find both `world-cup-predictor` **and**
   `world-cup-predictor-hq9k`.
2. Keep **`world-cup-predictor`** (it serves the real app, publicly). **Delete
   `world-cup-predictor-hq9k`** so pushes stop double-deploying.
3. On the kept project → **Settings → Deployment Protection** → ensure **Vercel
   Authentication is OFF** (otherwise visitors hit a login wall).
4. **Settings → Domains** → make your friendly URL (e.g. `worldcup-predictor.vercel.app`,
   or a custom domain) point at **Production**. If it's stuck on an old
   deployment, re-assign it / redeploy Production.
5. Confirm these **Environment Variables** are set on the kept project (Production):
   `SESSION_SECRET`, `CRON_SECRET`, `FOOTBALL_PROVIDER=espn`, the three
   `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`,
   and the three `VAPID_*` keys from [`DEPLOY.md`](DEPLOY.md) (push notifications
   stay silent without them).

✅ After this: every `git push` to `main` shows up at your URL within ~2 min.

---

## 3. First login (you two)

Open the app → **Log in** → pick your name (Carina / Johnny) → the **first PIN
you enter claims the account**. You're in, already in the same league, with all
the sample predictions live.

---

### Quick verify it worked
- Open `/dashboard` — you should see the **You vs <rival>** card and the
  **Explore** grid.
- Open a finished match — predictions + **points breakdown** show for both of you.
- On an upcoming match, the rival's pick is hidden with a **🕵️ Spy** button that
  charges (not errors) → that confirms `spy_reveals` is live.

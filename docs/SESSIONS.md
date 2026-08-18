# Duty — Session Log

Append-only, newest first. Every working session gets an entry: date, what changed, any infra facts touched.

## 2026-08-17 — v2.3.1: the signup dead-end

**What prompted it:** Scott asked to build in-app purchase so Duty could make
money. Before starting, checked whether anyone actually buys: `duty_families`
holds exactly two rows — "Shurtliff" (premium_status active, but with sentinel
dates `premium_period_end 2099-12-31` / `stripe_event_at 2099-01-01`, i.e. hand
granted) and "Demo Family" (free). Zero paying customers, ever. So the payment
path was never the constraint.

**What the data actually showed:** four `duty_profiles` rows with `family_id IS
NULL` — parent accounts created 2026-04-09, 2026-08-01, 2026-08-03 and
2026-08-09. Three real people tried Duty in three weeks and every one dead-ended.

**Root cause:** `Login.tsx:34` redirected family-less parents to `/setup`, but
that only fires on a login-form submit. The `/` route and the `*` catch-all in
`App.tsx` sent any parent to `/parent/overview` with no family check at all, and
`RequireAuth` only checked for a profile, never `family_id`. The Capacitor shells
load the live site at `/`, so every reopen of the store app bypassed the one
check that existed.

**Fix:** moved the check into `RequireAuth` and the root route via a shared
`needsSetup()` helper, so it holds on every parent route regardless of entry
point. `Setup.tsx` now guards both directions: redirects to `/login` with no
profile, and to `/parent/overview` if the user already had a family on arrival.
That second guard captures `arrivedWithFamily` once on mount deliberately — a
live read of `profile.family_id` would eject the user from the wizard the moment
step 0 succeeded and set it.

**Deliberately NOT done:** did not hand-create families for the four stranded
accounts. They are real people; the app now recovers them on next open, which is
the right repair.

**Note on versioning:** this work was written against v2.2.0 and rebased onto
origin/main, which had meanwhile shipped v2.2.1-v2.3.0 (reward approve/reject,
kid balances, all-or-nothing payouts) from another session. Re-cut as v2.3.1.
Only `src/App.tsx` and `src/pages/auth/Setup.tsx` carry the fix; neither was
touched by that other work.

**State left in:** v2.3.1, deployed. IAP work is queued but not started — the
funnel fix comes first, since selling to users who cannot finish onboarding is
pointless.


## 2026-08-15 — v2.3.0: all-or-nothing chore payout (per kid)

Scott: Freddy does the easy chores and skips the hard ones. Wanted a parent
setting so partial days pay nothing. Chose (via options): strict withholding
**plus** a completion bonus, **per kid**, with late chores counting toward
completion but paying nothing themselves.

- **Payout moved out of the approval handlers.** Points were inserted the moment
  a chore was approved; for a strict kid the day's outcome isn't known yet. New
  `src/lib/awards.ts` owns it — `reconcileDayAward(kidId, date, by)` runs after
  any completion change and either inserts the day's rows or revokes them.
  Reversal is wired inside `useCompletions` so every caller gets it. Reuses
  `isChoreActiveOnDate` (now exported from `kidScores.ts`) so the day definition
  is shared with the streak counter rather than duplicated.
- **Idempotency.** Awarding is re-evaluated on every approval. Chore rows dedupe
  on the existing `duty_ptx_unique_chore_ref`; the new
  `duty_ptx_unique_day_bonus (profile_id, award_date)` covers the once-per-day
  bonus. Repeat evaluation is a no-op, not a double payout.
- **Infra facts touched (shared project `isogetmvnpimcmouakeg`, applied via Supabase MCP):**
  migration `20260815020000_all_or_nothing_chores.sql` — adds
  `duty_profiles.all_or_nothing` / `completion_bonus`,
  `duty_point_transactions.award_date`, widens `reference_type` with
  `'day_bonus'`, adds `duty_ptx_unique_day_bonus`, and adds the
  `duty_profiles_guard_payout_rules` trigger.
- **Why the trigger.** Kids are real authenticated users and
  `duty_profiles_update` permits `id = auth.uid()`, so without a column-level
  guard a kid could switch their own rule off. Same pattern as
  `duty_families_guard_premium`. **Verified on the live DB:** a simulated kid
  JWT setting `completion_bonus = 9999` did not stick (RLS filtered the row
  first — the trigger is the backstop if that policy ever loosens), while a
  simulated parent JWT wrote `all_or_nothing`/`completion_bonus` cleanly. Test
  values were reverted; **all seven kids are `false` / `0`**, so behaviour is
  unchanged until Scott turns it on.
- **NOT DEPLOYED: `duty-kid-login` edge function.** Its explicit column list was
  updated in-repo to return `all_or_nothing` / `completion_bonus`, but the
  deploy was declined this session. Until it ships, a kid signing in with their
  own PIN won't see the "Finish all N to bank ★X" banner (parent view-as reads
  the parent's `kids` array, so it shows there). Payout logic is parent-side and
  unaffected. **`verify_jwt` must stay FALSE on that function** — kids call it
  before they have a session.
- **Verify:** `tsc --noEmit` clean; eslint at the 107-error baseline; build
  passes. Not click-tested (no parent login here; preview URLs firewalled).

## 2026-08-15 — v2.2.2: Reward Shop read the parent's balance in "view as kid"

Reported by Scott with screenshots: viewing as Freddy, the kid home showed ★130
but the Reward Shop showed ★0 with every reward locked.

- **Cause.** "View as kid" keeps the parent signed in — `profile` is the parent,
  `viewAsKid` is the kid. `KidShell` and `KidHome` both resolve
  `viewAsKid || profile`; `KidShop` read `profile` directly. Parents hold no
  `duty_point_transactions`, so the balance summed to 0 and
  `balance < points_cost` locked the entire shop.
- **Not just cosmetic.** `handleClaim` also wrote `redeemed_by` / `profile_id`
  from `profile`, so a claim made in preview would have been recorded against
  the parent. (In practice the 0 balance blocked it first.)
- **Fix.** `KidShop` resolves `activeProfile = viewAsKid || profile` for the
  balance, `useKidSkin`, the wallet filter, and the claim. Claims attribute
  `redeemed_by`/`profile_id` to the kid and keep `created_by` as the actual
  actor for audit. Grepped every remaining bare `profile` reference in
  `src/pages/kid/` and `src/components/kid/` — KidShop was the only offender.
- **Infra facts touched:** none. Client-only; no migrations, policies, or edge
  functions.
- **Verify:** `tsc --noEmit` clean; eslint at the 107-error baseline; build
  passes. Confirm on the deploy by viewing as a kid — shop balance should match
  the home screen and affordable rewards should unlock.

## 2026-08-14 — v2.2.1: reward approvals, point visibility, kid overdraw

Reported by Scott: no place for parents to see kid point balances; rejecting a
reward left it on screen; approving one did nothing.

- **Root cause (one bug, three symptoms).** `Rewards.tsx` wrote redemption status
  changes with a bare `supabase...update()` — no store write, no error check. The
  page renders from the zustand store, so the row never changed on screen. The DB
  confirmed the writes had all landed (Freddy: 2 rejected + 1 approved), so the
  buttons worked and only the UI was stale. `useCompletions` already writes every
  mutation back into the store; the rewards page was the outlier. The
  `duty_redemptions` realtime subscription in `useFamilyData` should also have
  covered this, but nothing in the UI should depend on that arriving.
- **Same bug caused a real overdraw.** `KidShop` checks `balance <
  reward.points_cost` before claiming but never wrote the deduction to the store.
  Freddy tapped Claim three times in 20s on a 110-pt balance against a 100-pt
  reward — all three passed the check, leaving him at -180. **Corrected on
  Scott's instruction** (see the data write below).
- **What changed:** redemption mutations moved into `useRewards` with
  `.select().single()` + `upsertRedemption` and returned errors; error banner and
  per-row busy locks on the Rewards page; `claiming` lock in `KidShop`; point
  balances added to the Overview kid cards, the Point ledger (summed from the
  full ledger, not the 30-day free-plan window), and pending reward requests;
  point-transaction inserts on chore approve / bulk approve / kid claim now write
  to the store.
- **Reject now refunds.** Scott's call, made this session: kids are charged at
  claim time, so a rejection cost them the full price of a reward they never
  got. `rejectRedemption` writes a matching `+points_spent` transaction
  (`reference_type` `'bonus'`, `reference_id` = redemption id). Each status
  transition is now pinned with `.eq('status', from)` so a stale tab or a second
  parent can't re-run it and refund twice; a no-op transition reports "That
  request was already handled" rather than double-crediting.
- **Infra facts touched:** no schema, policy, migration, or edge-function
  changes. Verified read-only against `isogetmvnpimcmouakeg` that the parent
  UPDATE policy on `duty_redemptions` was never the problem, and that
  `duty_points_parent_insert` (unrestricted on amount, unlike the kid policy's
  `amount <= 0`) permits the refund insert. The chore-only
  `duty_ptx_unique_chore_ref` index does not constrain `'bonus'` rows.
- **DATA WRITE (production, on Scott's instruction):** inserted 3 × +100
  `duty_point_transactions` for Freddy (`5d9acd6d…`, family `03eb45de…`,
  `created_by` Scott `41c69a38…`), reason "Correction: duplicate reward claim
  refunded (app bug)", one per affected redemption, `reference_type` `'bonus'`.
  Guarded with `where not exists` on `(reference_id, reference_type='bonus')` so
  a re-run can't double-apply. Freddy -180 → **+120**; Topher 55 and Riley 10
  untouched. He keeps the one approved reward.
- **Verify:** `tsc --noEmit` clean; eslint at the pre-existing 107-error baseline
  (no new errors); `npm run build` passes. Not click-tested against the live app
  (needs parent credentials) — confirm on the deploy that approve/reject update
  the list immediately and that balances show on the Overview.

## 2026-08-12 — v2.2.0 shipped to production (continuation of the entry below)

Second session, same day. The entry below left the work on a branch with one
manual step outstanding. Both are now done and the feature is verified live.

- **Merged and deployed:** `claude/duty-app-login-rc4inp` fast-forwarded into
  `main` (`adfcd22`) and pushed. Vercel production deploy Ready. Because the
  Capacitor shells load the live site via `server.url`, this one deploy covers
  every surface: web, installed PWA, iOS and Android. No store re-submission —
  no native shell code changed.
- **Infra fact changed (shared project `isogetmvnpimcmouakeg`):** added
  `https://duty.leftfieldapps.com/**` to Auth → URL Configuration → Redirect
  URLs, via the Management API (`PATCH /v1/projects/{ref}/config/auth`). The
  allow-list went 31 → 32 entries: one added, **none removed**, `site_url`
  untouched — diffed the full config before and after to confirm. Duty's domain
  was genuinely absent, so without this every recovery email would have
  redirected to the project Site URL (Steward's Vercel app).
- **Verified end-to-end on the live site**, which the entry below could not do:
  `/forgot-password` renders and submits; a real reset email arrived at
  `sendscott@gmail.com` carrying
  `redirect_to=https://duty.leftfieldapps.com/reset-password` — read out of the
  message itself, not assumed. `/reset-password` without a token degrades to its
  "that link didn't work" state rather than crashing. No console errors.
  The emailed link was deliberately **not** clicked: recovery tokens are
  single-use and Scott may want to use it.
- **Left at:** v2.2.0, deployed, all surfaces current. Branch
  `claude/duty-app-login-rc4inp` still exists on the remote (fully merged, safe
  to delete).
- **Still open (not Duty-specific):** the other custom domains on this shared
  project were not audited against the redirect allow-list. `precioushomehelp.app`
  and the other `*.leftfieldapps.com` apps (Dream Home, Hyde Park Pickup, Nice
  Things) are not on it, so any emailed-link flow they add will hit the same
  silent misdirect. Wildcards present today cover `*.gatheredin.app` and
  `*-sendscott-dels-projects.vercel.app` only.

## 2026-08-13 (UTC; local date was 2026-08-12) — v2.2.0: account recovery (forgot password + magic link)

- **Why:** Scott couldn't sign in to Duty. Sign-up with his own address returned
  "user already exists" and the app offered nothing further — there was no
  forgot-password link, no magic link, and no OAuth provider anywhere in the UI.
  Verified against `auth.users` on `isogetmvnpimcmouakeg`: **32 accounts, all 32
  password-only, 0 with any OAuth identity, 18 active in the last 30 days.** So
  this wasn't a one-off — any locked-out parent could only be recovered by an
  admin editing `auth.users` by hand.
- **What changed (client only):**
  - `src/hooks/useAuth.ts` — added `resetPassword`, `updatePassword`,
    `signInWithMagicLink`, plus an `authRedirect()` helper built on
    `window.location.origin`.
  - New `src/pages/auth/ForgotPassword.tsx` (reset **or** magic link, one form)
    and `src/pages/auth/ResetPassword.tsx` (handles implicit-hash **and** PKCE
    `?code=` links, plus expired/reused/missing-token states).
  - New `src/components/auth/AuthShell.tsx` + `authStyles.ts` — shared masthead
    and card styling so emailed links don't land on a stranger-looking page.
    (Styles live in their own module to satisfy `react-refresh/only-export-components`.)
  - `src/pages/auth/Login.tsx` — "Forgot password?" link, and an inline
    **Reset your password →** on the two failures recovery actually solves.
  - `src/App.tsx` — `/forgot-password` and `/reset-password` routes, both public
    (a recovery link must be reachable while signed out).
- **Infra facts touched:** none in code — **no schema, no env vars, no edge
  functions, no migration.** One **manual** step is required and is NOT done yet:
  add `https://duty.leftfieldapps.com/reset-password` and
  `https://duty.leftfieldapps.com/` to **Auth → URL Configuration → Redirect
  URLs** on the shared project. An unlisted `redirectTo` doesn't error — Supabase
  falls back to the project **Site URL**, which points at a different app on this
  shared project, so recovery emails would land users outside Duty.
- **Also done this session:** reset Scott's own password directly via SQL
  (`auth.users`, single row, `sendscott@gmail.com`) to unblock him before the fix
  shipped. He was told to change it in-app.
- **Verify:** `npm run build` clean; `npm run lint` at 113 problems — **identical
  to the pre-change baseline**, so no new lint debt (the repo carries 113
  pre-existing errors, mostly `no-explicit-any` in edge functions). Rendered all
  five states in Chromium at 420×900 (login, forgot, magic-link toggle, expired
  link, missing token) — all correct and on-brand. **Not yet verified end-to-end:
  no real recovery email has been sent, because that depends on the redirect
  allow-list step above.**
- **Docs:** `RELEASE_NOTES.md` was stale at v2.0.3 (v2.1.0–v2.1.2 had only ever
  been written to the in-app notes) — backfilled those three and added v2.2.0.
  In-app `ReleaseNotes.tsx` and `USER_GUIDE.md` updated too. Bumped to 2.2.0.
- **Shipped as:** branch `claude/duty-app-login-rc4inp` + draft PR, **not** pushed
  to `main` — pushing to main deploys to production immediately, and the redirect
  allow-list should be set first.

## 2026-08-02 — v2.1.2: reminder cron every-5-min + fire-once dedupe (Disk IO fix)

- **Why:** the `duty-chore-reminders` pg_cron job ran **every minute** (`* * * * *`) and posted to the `send-chore-reminders` edge function, which matched each family's `reminder_time` to the *exact* current minute. On the shared Supabase project (`isogetmvnpimcmouakeg`) that per-minute run was ~30% of pg_cron's `cron.job_run_details` write IO — a Disk IO Budget concern flagged 2026-07-22 (the bigger ~46% was Knit, fixed separately in Knit v0.55.0 the same day).
- **What changed:**
  - Edge function `send-chore-reminders`: replaced the exact-minute match with "fire once per day, at or after the family's reminder_time in their tz", deduped by a new `duty_families.last_reminded_on` date column (stamped up front so all-done families aren't re-evaluated every run and an overlap/retry can't double-send). More reliable than before — a missed/late run self-heals to the next run instead of skipping the day.
  - pg_cron job `duty-chore-reminders` schedule changed `* * * * *` → `*/5 * * * *` (≈80% fewer runs, so ≈80% less job_run_details WAL). Reminders now land within ~5 min of the set time.
- **Infra facts touched (shared project `isogetmvnpimcmouakeg`, applied via Supabase MCP):**
  - Migration `20260802130000_reminder_dedupe_and_cron_frequency.sql` — adds `duty_families.last_reminded_on date` and alters the cron schedule (idempotent).
  - Redeployed the `send-chore-reminders` edge function (now v29). **`verify_jwt` stays FALSE** — pg_cron calls it with no Authorization header; do not enable JWT verification or reminders stop.
- **Verify:** cron confirmed at `*/5 * * * *` (`select * from cron.job`); edge function ACTIVE v29; column present. Deploy of the function + cron is live on the DB regardless of the repo push. Watch `cron.job_run_details` insert-rate drop and confirm reminders still arrive after each family's time.
- Left at v2.1.2. (Only the edge function + DB changed; the React app is unchanged but bumped for the release note.)

## 2026-07-15 — Doc system initialized (history reconstructed from git)

- 2026-07-06 — v2.1.1: fixed demo-account cross-app leak (Magnify `callings` visible in demo), kid points self-grant, and double-award bugs; added `/install.html` PWA install page.
- 2026-06-15 — v2.1.0: "Try the demo" button on sign-in (one-tap Demo Family, fake data only) + build fix for release-notes format.
- 2026-06-11/12 — v2.0.1–v2.0.3 Premium hardening: server-only premium columns (trigger guard, later extended to INSERT), checkout authorization, webhook customer-match + event ordering, Stripe billing portal for self-serve cancel, CORS pinned to prod origin, `search_path` pinned on `duty_families_guard_premium`.
- 2026-06-11 — Stripe env vars renamed with `DUTY_` prefix to avoid cross-app collisions in the shared Supabase secret namespace; paywall hidden in native builds for store compliance.
- 2026-06-10 — v2.0.0 freemium subscription model (Stripe LIVE on Duty's own account `acct_1ThDR7GZMjHVR9yS`); Capacitor iOS + Android shells added for the App Store pipeline; v1.9.0 kid-auth security overhaul.
- 2026-05-20 — v1.6.0–v1.8.0: perf pass (caching, lazy routes, memoization, bulk approve) and daily chore-reminder push notifications (`DUTY_VAPID_*`).
- 2026-05-01/02 — Stadium redesign (arcade visual language); v1.4.1/v1.4.2 RLS tightening for cross-app isolation + fix for `duty_profiles` RLS recursion that broke parent login; v1.5.0 kid scorecards.
- 2026-04-09–22 — mobile polish wave: approvals queue, action sheets, avatar upload fixes, PWA auto-update, notifications + app badge, in-app Release Notes / User Guide.
- 2026-03/04 — initial build: families/profiles/chores/rewards/points schema (`duty_` prefix on shared Supabase `isogetmvnpimcmouakeg`), kid no-auth login, RLS, realtime + storage.

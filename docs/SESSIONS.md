# Duty — Session Log

Append-only, newest first. Every working session gets an entry: date, what changed, any infra facts touched.

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

# Duty — current state

> Read this before touching the app. Update it the MOMENT an infra fact changes (database, domain, auth) — don't wait for session end. Append an entry to docs/SESSIONS.md at the end of every working session. (This system exists because on 2026-07-14 a session wrote hours of content to the wrong Supabase project — the move was documented nowhere.)

## What this is

Duty is a family chore-tracking app for Scott's kids: parents assign chores, kids earn points, points buy rewards. It has a freemium Premium tier (Stripe subscriptions) and native iOS/Android shells for an App Store submission under the "Left Field Apps" publisher. **Lane: Personal/Family** (but it's also a commercial App Store product).

## Infrastructure — VERIFY BEFORE ANY DB WRITE

- **Supabase:** project ref `isogetmvnpimcmouakeg` — **SHARED project** — schema/auth changes affect the other apps on `isogetmvnpimcmouakeg` (Magnify, Glean, Knit, Draft Room, mc-staff, Dream Home, Planet Rivals, Sparkle Pro, …). Confirm the ref before every DB write.
- **Table prefix:** `duty_` (verified in `supabase/migrations/` and `src/`: `duty_families`, `duty_profiles`, `duty_chores`, `duty_chore_completions`, `duty_rewards`, `duty_redemptions`, `duty_point_transactions`, `duty_challenges`, `duty_push_subscriptions`, `duty_kid_login_attempts`). Note: some older notes call this the "`chores_` prefix" — that is stale; the real prefix is `duty_`.
- **Auth:** shared Supabase Auth (parent accounts); kids log in without auth accounts via the `duty-kid-login` edge function (locked down in migration `20260610…_kid_auth_lockdown`).
- **Hosting/domain:** Vercel project `duty-app` → production at **https://duty.leftfieldapps.com** (also referenced: `dutychores.app` for the demo account email domain).
- **GitHub remote:** `origin` → https://github.com/sendscott-del/duty-app (branch `main`; push = deploy via Vercel).
- **Native shells:** Capacitor iOS + Android (`ios/`, `android/`); `capacitor.config.ts` loads the live site via `server.url: https://duty.leftfieldapps.com`, appId `com.leftfieldapps.duty`. App Store track under "Left Field Apps".
- **Stripe:** LIVE mode on Duty's **own** Stripe account `acct_1ThDR7GZMjHVR9yS` (not the shared/Homefront accounts). Product + monthly & annual prices + webhook. Edge-function secrets (names only): `DUTY_STRIPE_SECRET_KEY`, `DUTY_STRIPE_WEBHOOK_SECRET`, `DUTY_STRIPE_PRICE_MONTHLY`, `DUTY_STRIPE_PRICE_ANNUAL` — set as Supabase secrets on the shared project (hence the `DUTY_` namespace; the secret namespace is project-wide across all apps).
- **Push notifications:** Web Push with `DUTY_VAPID_*` server env names; client `VITE_VAPID_PUBLIC_KEY`.
- **Client env (names only, in `.env.local` / Vercel):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.
- **Demo account:** `demo@dutychores.app` — Duty-only sandbox. A cross-app leak (Magnify `callings` data visible to demo) was fixed in v2.1.1.

## Architecture snapshot

- **Stack:** Vite + React 19 + TypeScript, Tailwind 4, zustand, react-router; PWA (service worker `sw.js`, `/install.html` install page) + Capacitor native shells.
- **Layout:** `src/pages`, `src/components`, `src/hooks`, `src/lib`; `supabase/migrations/` (numbered 001–020 then timestamped) and `supabase/functions/` (`create-checkout-session`, `create-portal-session`, `stripe-webhook`, `duty-kid-login`, `send-chore-reminders`).
- **Chore reminders:** pg_cron job `duty-chore-reminders` runs **every 5 min** (`*/5 * * * *`) and POSTs to the `send-chore-reminders` edge function (which runs with **`verify_jwt: false`** — the cron sends no auth header; don't enable JWT or reminders break). The function fires each family's reminder **once per day at/after `reminder_time`** in their tz, deduped by `duty_families.last_reminded_on`. Was every-minute + exact-minute match until v2.1.2 (2026-08-02) — changed to cut its share of the shared project's Disk IO. Keep it write-light per run.
- **Premium is server-truth:** `premium_status` + Stripe columns on `duty_families` are writable only by service role via DB trigger/guard (`duty_families_guard_premium`, covers INSERT and UPDATE); checkout verifies the caller is a parent of the family; webhook matches Stripe customer and ignores out-of-order events (`stripe_event_at`).
- **Native builds hide the Stripe paywall** (App Store / Play compliance).

## Rules for this repo

- Version lives in `package.json` (currently 2.x); every shipped change bumps it and appends to `RELEASE_NOTES.md` and updates `USER_GUIDE.md`.
- Deploy = push to `origin main`; Vercel auto-deploys. Test on the deployed URL, not local.
- Schema changes go in `supabase/migrations/` files.
- Append a docs/SESSIONS.md entry at the end of every working session; update this file immediately when an infra fact changes.
- No secrets in committed files — env var names only.

## Gotchas

- **Shared Supabase:** RLS/auth/schema mistakes here leak across apps — v1.4.1 tightened RLS "for cross-app isolation" and v2.1.1 fixed the demo account leaking Magnify `callings` data. Any new policy or view must be scoped to `duty_` tables and this app's users.
- **Shared secret namespace:** Supabase edge-function secrets are project-wide; always prefix new ones `DUTY_` and grep other app repos for the name before `supabase secrets set` (a collision once clobbered another app's VAPID keys → the `DUTY_VAPID_*` rename in v1.8.0).
- **Paywall bypass history:** premium columns were client-writable twice (UPDATE-only guard missed INSERT). Don't relax the `duty_families` guard or grant client writes to premium/Stripe columns.
- **`duty_profiles` RLS recursion** broke parent login once (v1.4.2) — be careful with policies that select from `duty_profiles` inside `duty_profiles` policies.
- After a native-relevant change, the App Store build is a separate step — the Capacitor shell serves the live site, but plugin/config changes need a new binary.

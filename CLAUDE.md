# Duty — current state

> Read this before touching the app. Update it the MOMENT an infra fact changes (database, domain, auth) — don't wait for session end. Append an entry to docs/SESSIONS.md at the end of every working session. (This system exists because on 2026-07-14 a session wrote hours of content to the wrong Supabase project — the move was documented nowhere.)

## What this is

Duty is a family chore-tracking app for Scott's kids: parents assign chores, kids earn points, points buy rewards. It has a freemium Premium tier (Stripe subscriptions) and native iOS/Android shells for an App Store submission under the "Left Field Apps" publisher. **Lane: Personal/Family** (but it's also a commercial App Store product).

## Infrastructure — VERIFY BEFORE ANY DB WRITE

- **Supabase:** project ref `isogetmvnpimcmouakeg` — **SHARED project** — schema/auth changes affect the other apps on `isogetmvnpimcmouakeg` (Magnify, Glean, Knit, Draft Room, mc-staff, Dream Home, Planet Rivals, Sparkle Pro, …). Confirm the ref before every DB write.
- **Table prefix:** `duty_` (verified in `supabase/migrations/` and `src/`: `duty_families`, `duty_profiles`, `duty_chores`, `duty_chore_completions`, `duty_rewards`, `duty_redemptions`, `duty_point_transactions`, `duty_challenges`, `duty_push_subscriptions`, `duty_kid_login_attempts`). Note: some older notes call this the "`chores_` prefix" — that is stale; the real prefix is `duty_`.
- **Auth:** shared Supabase Auth (parent accounts); kids log in without auth accounts via the `duty-kid-login` edge function (locked down in migration `20260610…_kid_auth_lockdown`).
- **Auth redirect allow-list (2026-08-12):** `https://duty.leftfieldapps.com/**` is on the shared project's Auth → URL Configuration allow-list. It was NOT there until account recovery shipped (v2.2.0), and every emailed link would have redirected to the project Site URL (`steward-sendscott-dels-projects.vercel.app`) instead of Duty. The project Site URL belongs to another app, so **any new emailed-link flow here needs its origin on that allow-list or it silently lands in the wrong app.** Verify by reading the reset email's `redirect_to=` parameter, not by assuming.
- **Hosting/domain:** Vercel project `duty-app` → production at **https://duty.leftfieldapps.com** (also referenced: `dutychores.app` for the demo account email domain).
- **GitHub remote:** `origin` → https://github.com/sendscott-del/duty-app (branch `main`; push = deploy via Vercel).
- **Native shells:** Capacitor iOS + Android (`ios/`, `android/`); `capacitor.config.ts` loads the live site via `server.url: https://duty.leftfieldapps.com`, appId `com.leftfieldapps.duty`. App Store track under "Left Field Apps".
- **Billing is TWO paths into the same columns.** Web = Stripe; iOS = Apple IAP via RevenueCat. Both write `premium_status` / `premium_period_end` / `stripe_event_at` on `duty_families`, and both are service-role-only writers (see the guard below). They deliberately share `stripe_event_at` as one ordering clock so a late redelivery from either source cannot clobber newer state from the other.
- **RevenueCat (iOS, added 2026-08-17):** project **`proj3cf3350c`** ("Duty"), app `appd65b7750dd` (App Store, `com.leftfieldapps.duty`), entitlement **`premium`** `entl7b4258f7e3`, offering `default` `ofrng4f5241a7f9` (packages `$rc_monthly`, `$rc_annual`). Public SDK key `appl_SvZiwbhFDoomDEvdFHDdTMSciig` is inlined in `src/lib/revenuecat.ts` (public by design). Secret key: `~/.config/gatheredin/revenuecat-duty.env`, never in the repo. **The RevenueCat `app_user_id` is the `duty_families.id`, not a user id** — premium is a family-level fact, so either parent's purchase covers the family. ASC subscription group `Duty Premium` 22316548; products `com.leftfieldapps.duty.premium.monthly` ($2.99) / `.annual` ($19.99). App Store Connect API key IS configured in RevenueCat; the **In-App Purchase key is NOT** (Apple has no API for creating one — dashboard only), and until it is, RevenueCat cannot refresh subscription state server-side.
- **`DUTY_REVENUECAT_WEBHOOK_SECRET` is NOT SET.** The `revenuecat-webhook` function is deployed and returns 401 to everything until it exists. Closed-by-default is intentional; purchases will not grant premium until this is set and the webhook is configured in the RevenueCat dashboard.
- **Stripe:** LIVE mode on Duty's **own** Stripe account `acct_1ThDR7GZMjHVR9yS` (not the shared/Homefront accounts). Product + monthly & annual prices + webhook. Edge-function secrets (names only): `DUTY_STRIPE_SECRET_KEY`, `DUTY_STRIPE_WEBHOOK_SECRET`, `DUTY_STRIPE_PRICE_MONTHLY`, `DUTY_STRIPE_PRICE_ANNUAL` — set as Supabase secrets on the shared project (hence the `DUTY_` namespace; the secret namespace is project-wide across all apps).
- **Push notifications:** Web Push with `DUTY_VAPID_*` server env names; client `VITE_VAPID_PUBLIC_KEY`.
- **Client env (names only, in `.env.local` / Vercel):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`.
- **Demo account:** `demo@dutychores.app` — Duty-only sandbox. A cross-app leak (Magnify `callings` data visible to demo) was fixed in v2.1.1.

## Architecture snapshot

- **Stack:** Vite + React 19 + TypeScript, Tailwind 4, zustand, react-router; PWA (service worker `sw.js`, `/install.html` install page) + Capacitor native shells.
- **Layout:** `src/pages`, `src/components`, `src/hooks`, `src/lib`; `supabase/migrations/` (numbered 001–020 then timestamped) and `supabase/functions/` (`create-checkout-session`, `create-portal-session`, `stripe-webhook`, `revenuecat-webhook`, `duty-kid-login`, `send-chore-reminders`).
- **Chore reminders:** pg_cron job `duty-chore-reminders` runs **every 5 min** (`*/5 * * * *`) and POSTs to the `send-chore-reminders` edge function (which runs with **`verify_jwt: false`** — the cron sends no auth header; don't enable JWT or reminders break). The function fires each family's reminder **once per day at/after `reminder_time`** in their tz, deduped by `duty_families.last_reminded_on`. Was every-minute + exact-minute match until v2.1.2 (2026-08-02) — changed to cut its share of the shared project's Disk IO. Keep it write-light per run.
- **Premium is server-truth:** `premium_status` + Stripe columns on `duty_families` are writable only by service role via DB trigger/guard (`duty_families_guard_premium`, covers INSERT and UPDATE); checkout verifies the caller is a parent of the family; webhook matches Stripe customer and ignores out-of-order events (`stripe_event_at`).
- **Android billing: NOT BUILT, by decision (Scott, 2026-08-17 — "ignore android").** The IAP path is gated on `isIOSApp`, not `isNativeApp`, precisely because `cap sync` installs plugins to both platforms and an Android build would otherwise configure RevenueCat with the Apple key. Android shows the pre-IAP message. Play billing would need its own RevenueCat Play Store app and `goog_…` key.
- **Native builds hide the STRIPE paywall** (App Store / Play compliance) — but as of v2.4.0 iOS shows an **Apple IAP** paywall instead, when the build supports it.
- **The single most important constraint in this repo:** the Capacitor shells render the DEPLOYED SITE via `server.url`. Any client code you ship reaches the CURRENT App Store binary the moment Vercel deploys — including binaries that lack a native plugin your code depends on. `src/lib/revenuecat.ts` is gated on `Capacitor.isPluginAvailable('Purchases')` and fails soft for exactly this reason; older builds fall back to the pre-IAP message. **Never remove that gate, and apply the same pattern to any future native plugin.**

## Delivery surfaces (verify EVERY one per release — see global tech-stack.md rule)

| Surface | How it updates | Timeline | Verify by |
|---|---|---|---|
| Web (duty.leftfieldapps.com) | Vercel on git push | ~2 min | load site |
| Installed PWA | same Vercel deploy; SW refresh on next open | minutes | reload twice |
| iOS/Android (Capacitor shells) | load the LIVE SITE via `server.url` | same Vercel deploy, next app open | open the store app after deploy |

Unlike Magnify (embedded Expo bundle + OTA), the native shells here render the deployed website — **one Vercel deploy updates every surface.** A store re-submission is only needed when native shell code/plugins change (splash, push plugin, appId). Never assume the Magnify OTA model applies here, or vice versa.

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

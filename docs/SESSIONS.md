# Duty — Session Log

Append-only, newest first. Every working session gets an entry: date, what changed, any infra facts touched.

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

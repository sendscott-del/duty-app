# Duty Release Notes

> Note: this file had drifted — v2.1.0 through v2.1.2 shipped but were only ever
> written to the in-app notes (`src/pages/parent/ReleaseNotes.tsx`), which is the
> user-facing list and stayed current. Both are updated for v2.2.0; the v2.1.x
> entries below were backfilled from `docs/SESSIONS.md` and git history.

## v2.2.0 — August 13, 2026

### Account recovery

Duty had **no way to recover an account**. There was no "forgot password", no
magic link, and no OAuth provider — so a parent who forgot their password was
locked out permanently and could only be rescued by an admin editing
`auth.users` by hand. Every account on the shared project is password-only.
Signing up again didn't help either: it returned "user already exists" and
stopped there, which is exactly the dead end that surfaced this.

- **Forgot-password flow.** New `/forgot-password` page emails a Supabase
  recovery link; new `/reset-password` page turns that link into a new password.
  Handles both link shapes (implicit hash tokens and PKCE `?code=`), plus
  expired, reused, and malformed links, each with a route back to requesting a
  fresh one.
- **Magic-link sign-in.** The same page can instead email a link that signs you
  straight in. `shouldCreateUser: false` keeps account creation on the sign-up
  form, so every new parent still gets a `duty_profiles` row with their real name.
- **Dead ends now offer a way out.** "An account already exists for that email"
  (sign-up) and "Invalid login credentials" (sign-in) now render an inline
  **Reset your password →** link instead of terminating.
- **No account enumeration.** Both requests show the same neutral confirmation
  whether or not the address is registered; only HTTP 429 rate-limiting is
  surfaced, since that's actionable and reveals nothing.

### Operator step required — the flow misroutes until this is done

Add these to the shared project's **Auth → URL Configuration → Redirect URLs**
allow-list (project `isogetmvnpimcmouakeg`):

- `https://duty.leftfieldapps.com/reset-password`
- `https://duty.leftfieldapps.com/` (magic link)
- `http://localhost:5173/reset-password` (local dev, optional)

An unlisted `redirectTo` does not error — Supabase silently falls back to the
project **Site URL**, which on this shared project points at a *different app*.
Recovery emails would land users somewhere that isn't Duty.

### Notes

- No schema changes, no new env vars, no edge-function changes.
- No native rebuild needed: the Capacitor shells load the live site via
  `server.url`, so one Vercel deploy covers web, PWA, iOS, and Android.

## v2.1.2 — August 2, 2026

- Chore reminders reworked to fire once per day at/after each family's
  `reminder_time` (deduped via `duty_families.last_reminded_on`), with the
  `duty-chore-reminders` cron moved `* * * * *` → `*/5 * * * *` to cut its share
  of the shared project's Disk IO.

## v2.1.1 — July 6, 2026

- Fixed the demo account leaking Magnify `callings` data across apps; fixed kid
  points self-grant and double-award; added retry/error handling to first-time
  family setup; added the `/install.html` PWA install page.

## v2.1.0 — June 15, 2026

- "Try the demo" button on the sign-in screen, opening an isolated Demo Family
  with fictional data and no account required.

## v2.0.3 — June 12, 2026

### Premium hardening (round 2)
- **Closed the INSERT-side paywall bypass.** The premium-columns guard now fires on INSERT as well as UPDATE. Previously a parent could create a brand-new family row pre-set to Premium and repoint their profile at it — the UPDATE-only guard didn't cover that path. Client-created families must now start on the free tier; only the payment system can set premium/Stripe values.
- **Webhook customer match + event ordering.** `stripe-webhook` now updates a family only when the event's Stripe customer matches the one on file, and ignores stale/out-of-order Stripe redeliveries (via a new `stripe_event_at` marker) so a late "still active" event can't resurrect a canceled subscription.
- **No duplicate subscriptions.** `create-checkout-session` now refuses to open checkout for a family that's already Premium (server-side backstop against double billing) and returns a clean 404 if the family can't be found.
- **CORS pinned.** The Stripe edge functions now allow only the production Duty origin instead of `*`.

## v2.0.2 — June 11, 2026

### Subscription management
- **Self-serve cancel / manage.** The Premium card in Settings now has a **Manage subscription** button (web only, hidden in the native app) → new `create-portal-session` edge function → Stripe billing portal, where users can cancel (at period end), update payment method, and view invoices. A default live-mode portal configuration was created. Closes the gap where the Upgrade page promised "cancel any time" with no way to do it.

## v2.0.1 — June 11, 2026

### Premium hardening
- **Premium is server-truth.** `premium_status` and the Stripe columns on `duty_families` are now writable only by the payment system (service role) via a database trigger — they can no longer be set from the app or browser, closing a paywall bypass.
- **Checkout authorization.** `create-checkout-session` now verifies the caller is a parent of the requested family before doing anything (closes an IDOR where any signed-in user could start checkout / attach a customer to another family).
- **Webhook reliability.** Signature verification now uses `constructEventAsync` (required by the Deno Edge runtime — the sync version would reject every real event), subscription period parsing is API-version-safe, and failed DB writes are logged.
- **Auto-refresh after checkout.** Returning from Stripe (`?upgraded=1`) re-fetches the family so Premium reflects without a manual reload.
- **Copy fix.** Premium history is now described accurately as full history (free stays at 30 days).

## v2.0.0 — June 11, 2026

### Premium Subscription

Duty is now freemium. The core chore loop — unlimited kids, unlimited chores, approvals, rewards, push notifications — stays free forever. A new **Premium** tier ($2.99/month or $19.99/year) unlocks three features:

- **Weekly family challenges.** Set a family goal each week (total completions, streak squad, no-miss week) and earn bonus points together. Tap the challenge card on Overview to pick one.
- **Require photo proof.** When adding or editing a chore, enable "Require photo proof" to make kids snap a photo before submitting. Keeps everyone honest.
- **Full history.** Free accounts see the last 30 days of point history. Premium unlocks your complete history.

### New screens
- **Upgrade screen** (`/parent/upgrade`) — monthly/annual plan toggle, feature list, Stripe checkout redirect.
- **Premium status card** in Settings — shows active plan or upgrade prompt.

### Infrastructure
- `duty_families` table gains `premium_status`, `premium_period_end`, `stripe_customer_id`, `stripe_subscription_id`.
- New Supabase Edge Functions: `create-checkout-session` (Stripe Checkout) and `stripe-webhook` (subscription lifecycle).
- Requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `APP_ORIGIN` secrets on the Edge Function.

---

## v1.8.0 — May 20, 2026

### New Features
- **Daily chore reminders.** At a configurable time each day (default **6:00 PM** Chicago time), Duty now sends Web Push notifications:
  - **Kids** with incomplete chores get a ping on every device they've subscribed: *"🚽 You've got 3 chores to flush — tap to crush 'em."*
  - **Parents** get a one-line summary on every device they've subscribed: *"Frederick: 3 · Christopher: 1."*
  - Nobody gets pinged if everyone's already done for the day.
- **Reminders settings card** in parent Settings: enable toggle + time picker.
- **Kid opt-in banner** on the kid home screen — first time a kid opens the app on a new device, they see a "Get a ping when chores are left" button. Dismissable.
- Notifications toggle (parent Settings) now wires through real Web Push instead of just requesting browser permission — the server can now actually push to subscribed devices when the app is closed.

### Infrastructure
- New `duty_push_subscriptions` table (RLS-scoped per family; anon-writable for kids' own subscriptions).
- New `reminder_time`, `reminder_timezone`, and `reminders_enabled` columns on `duty_families`.
- New Supabase Edge Function `send-chore-reminders`, triggered by pg_cron every minute. Loops families whose reminder time matches now-in-TZ, computes incomplete chores using the same recurrence logic as the app, and sends Web Push via VAPID. Garbage-collects dead endpoints (404/410) automatically.
- New `public.duty_trigger_chore_reminders()` SECURITY DEFINER function called by pg_cron.
- Service worker `push` and `notificationclick` handlers — pings route the kid to `/kid` and parents to `/parent/overview`.

### Notes
- Requires `VITE_VAPID_PUBLIC_KEY` env var on Vercel and `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` secrets on the Supabase Edge Function.

---

## v1.7.0 — May 20, 2026

### Performance
- **Approve-All is now one round-trip, not N.** Previously approving 20 pending chores ran 40 sequential network calls (one update + one point-transaction insert per row, awaited in a `for` loop). Now it's a single bulk update on `duty_chore_completions` and a single bulk insert on `duty_point_transactions`, run in parallel, with optimistic local updates so the list collapses instantly.
- **`getCompletion` is O(1) instead of O(N).** The lookup that runs once per chore row on every render now uses a memoized `Map` keyed by `chore_id|date`. Previously it scanned the full completions array on every row, every render.
- **Kid scorecard math is memoized.** The 30-day-window `getKidScore` scan only recomputes when kids, chores, or completions actually change — not on every modal open or date-nav click.
- **Sign-in is faster.** The post-login family and kids queries run in parallel instead of sequentially.
- **Editing a kid no longer reloads the whole profile.** Adding, editing, or deleting a kid in Settings used to refetch profile + family + kids from the database. Now it updates the local store directly — instant, with the same end result.
- **canvas-confetti is lazy-loaded.** The 10 KB library no longer ships in the main bundle; it loads only when a parent actually approves a chore.
- **Service worker no longer auto-reloads every 60 seconds.** Update checks happen on tab focus instead, and the new version activates silently — taking effect on the next manual reload or navigation. No more losing form input mid-edit.
- **Removed tap-scale `motion` wrappers from chore rows and cards.** Replaced with CSS `:active` transforms — same feel, no per-instance motion overhead on lists.

### Notes
- No behavior changes — same approve/reject/undo flows.

---

## v1.6.0 — May 20, 2026

### Performance
- **Page navigation is now instant.** Every page previously re-fetched its data from Supabase on mount, showing a spinner each time you moved between Overview, Approvals, Chores, Rewards, and History. Chores, completions, rewards, redemptions, point transactions, and the current weekly challenge now live in a single in-memory cache that is populated once per session and updated live via realtime subscriptions. Subsequent navigations render straight from cache — no spinner, no network round-trip.
- **One realtime channel per family, not five per page.** Previously each data hook opened its own Supabase realtime subscription, and those were torn down and recreated on every page mount. Now a single channel watches all six tables for the family for the lifetime of the session.
- **Route-level code splitting.** Pages are now loaded on demand instead of bundled into one ~680 KB JavaScript file. First paint downloads the app shell plus the page you're landing on (typically under 100 KB gzipped); other pages stream in only when you navigate to them. Vendor code (React, Supabase, Framer Motion, confetti) is split into long-cacheable chunks.

### Notes
- No behavior changes — every page works the same, with the same approve/reject/undo/celebrate flows. Realtime updates from other devices still appear automatically.

---

## v1.5.0 — May 2, 2026

### New Features
- **Kid scorecards on the parent Overview.** A new row above the chores list shows each kid with a 7-day completion rate, current streak, and a status pill — **CRUSHING IT** (≥80%), **KEEPING UP** (≥50%), or **SLIPPING** (<50%) — so you can see at a glance who's keeping up and who's drifting. Tap a card to switch to that kid's view.

### Performance
- **Faster page loads after the v1.4.1 RLS work.** Replaced per-row policy function calls with a per-statement cached lookup using `(select duty_my_parent_family_id())`. Pages with many rows (chores, completions, points) now do a single function call per query instead of one per row.

---

## v1.4.2 — May 2, 2026

### Bug Fixes
- **Fixed parent login broken by v1.4.1.** The new profile read policy contained a self-referencing subquery that triggered infinite recursion in Postgres RLS, blocking the post-login profile fetch. Replaced with a SECURITY DEFINER helper (`duty_my_family_id()`) that bypasses RLS for the caller's own family lookup.

---

## v1.4.1 — May 2, 2026

### Security Hardening
- **Locked down database access policies.** Reworked every `duty_*` Supabase RLS policy so authenticated parents can only read or modify their own family's data, and the kid (anon) role is restricted to the specific operations kids actually need: read chores/rewards/balance, submit a completion as `submitted`, undo a not-yet-approved completion, and redeem a reward. Anon can no longer delete chores, edit chores, change other families' data, award itself points, or alter completions after they've been approved.
- **Cross-app isolation.** Parents authenticated via another app on the shared Supabase project (Steward, Magnify, etc.) can no longer touch Duty data — the new policies require a `duty_profiles` row with `role='parent'` in the specific family, not just any logged-in account.
- **Private chore storage buckets.** `chore-photos` and `chore-proofs` storage buckets switched from public to private. New family-scoped storage policies allow only parents in the matching family to read/write files. Path convention: `<family_id>/<rest>`. (No data movement; the buckets were empty.)

### Notes
- No user-facing changes. The app behaves the same — kids log in by PIN, parents by email/password, chore submissions/approvals/redemptions all work the same.
- Internal: introduced `duty_is_family_parent(family_id)` helper function used across the new policies.

---

## v1.4.0 — May 1, 2026

### New Features
- **Stadium redesign.** Completely new visual language across every screen: cream backgrounds, hard-edge ink borders, chunky offset drop-shadows, three new typefaces (Bagel Fat One for shouts, Bricolage Grotesque for body text, JetBrains Mono for stats and labels). Loud, chunky, arcade-y — Mario meets sticker book.
- **Sir Flush mascot.** New crowned-toilet character built as an inline SVG. Scales infinitely, has multiple expressions (happy, wink, cheer, sleepy), and shows up on the login screen, kid hero card, parent sidebar, celebrate overlay, and empty states.
- **Per-kid age skin.** Every kid now has a "vibe" toggle in Settings → Kids:
  - **Younger (8–10)** — big mascot, picture-first chore tiles in a 2-col grid, "Flush it!" energy, full confetti celebrate.
  - **Teen (11+)** — dark mode (ink #0f0f10), dense stat-row dashboard, slim checkbox chore rows, neutral copy.
- **Celebrate overlay.** Completing a chore now triggers a full-screen pop with Sir Flush, +points chip, and confetti (Younger skin) or a slim "+points · streak" toast (Teen skin).
- **New Stadium primitives.** Component library expanded with PointChip, StreakBadge, StatCard, PinPad, Confetti, and SirFlush. All existing primitives (Button, Badge, Modal, Input, ProgressBar, Avatar) restyled to match.
- **Restyled every screen.** Login, KidPin, Setup, KidHome, KidShop, Overview, Chores, Approvals, Rewards, History, Settings, Release Notes, Guide, AddChore sheet, AddReward sheet, WeeklyChallenge.

### Notes
- All chore/reward/completion data, hooks, and Supabase tables are unchanged — this release is purely visual.
- Per-kid skin preference is stored in localStorage on the device that views it, so each browser/install can have its own vibe.

---

## v1.3.0 — April 20, 2026

### New Features
- **Approvals queue.** A new **Approvals** tab collects every submitted chore across all dates into one list. No more scrolling day-by-day to find chores waiting for your thumbs up. Items are grouped by day (Today, Yesterday, earlier) with photo proof shown inline and per-row Approve / Reject / Clear actions.
- **Approve all.** A single button approves every pending chore in the queue at once — useful after being out of town.
- **Tappable "Pending" tile on Overview.** The Pending Approvals stat card on the Overview now shows the total across *all* dates, glows amber when you have pending items, and tapping it jumps straight to the Approvals queue.

### Navigation
- Approvals tab sits in both the desktop sidebar and the mobile bottom nav (second slot) with a live count badge so you always know what's waiting.

---

## v1.2.6 — April 20, 2026

### Bug Fixes
- **Add Chore button now reachable on iPhone.** The bottom-sheet modal was being cut off below the iOS home indicator / dynamic toolbar, hiding the Add Chore button. Modal now uses dynamic viewport height and respects `safe-area-inset-bottom`. The title header is also pinned while the form scrolls.

---

## v1.2.5 — April 9, 2026

### Bug Fixes
- **Fixed status bar overlap on mobile.** Content no longer hides behind the time, Wi-Fi, and battery indicators on phones. Added safe area padding at the top of the parent view.
- **Add Chore button works on mobile.** The button was being covered by the phone's status bar, making it untappable.

---

## v1.2.4 — April 9, 2026

### New Features
- **View as Kid on mobile.** A kid picker strip now appears above the bottom navigation bar. Tap any kid's name to switch to their view — same as the sidebar feature on desktop.

### Improvements
- **Sidebar eye icon always visible.** The "View as" eye icon in the desktop sidebar is now always visible instead of only on hover.

---

## v1.2.3 — April 9, 2026

### Improvements
- **Mobile action sheet for chores.** Tapping a chore row on mobile now opens a bottom sheet with all available actions (Approve, Reject, Undo Approval, Edit, Delete, etc.). Previously these were only available on hover, which doesn't work on phones.
- Desktop still uses hover-to-reveal icons.

---

## v1.2.2 — April 9, 2026

### New Features
- **Reject chores.** When a kid submits a chore, parents can now reject it (thumbs-down icon on hover). The kid sees "Try again" and can redo the chore.
- **Undo approval.** After approving a chore, parents can undo it (undo icon on hover). This reverts the status back to "Needs approval" and removes the points that were awarded.
- **Clear completion.** Parents can fully clear a submitted or rejected chore (X icon on hover), resetting it to pending as if the kid never marked it done.

---

## v1.2.1 — April 9, 2026

### Bug Fixes
- **Auto-update for installed PWA.** The app now checks for updates every 60 seconds and automatically reloads when a new version is available. No more needing to delete and reinstall from the home screen.
- **Fixed service worker not loading.** Vercel's catch-all rewrite was serving `index.html` instead of `sw.js`, so the service worker never registered. Added explicit rewrite rules for `sw.js` and `manifest.json`.

---

## v1.2.0 — April 9, 2026

### New Features
- **Push notifications.** Parents get notified when kids complete chores or request rewards. Kids get notified when their chores are approved. Works when the app is open or in the background (installed PWA).
- **Notification settings.** New toggle in Settings to enable/disable notifications. Shows current permission status and what you'll be notified about.
- **Install app guide.** Settings now detects whether Duty is installed as an app and shows step-by-step instructions for iPhone, Android, and desktop if it's not.
- **App icon badge.** When Duty is installed as a PWA, the app icon shows a red badge with the total pending count.

---

## v1.1.4 — April 9, 2026

### New Features
- **App icon badge.** (Moved to v1.2.0 as part of the full notifications feature.)

---

## v1.1.3 — April 9, 2026

### Bug Fixes
- **Fixed kid profile picture uploads (for real this time).** Switched from Supabase storage upload to client-side image resize + base64 stored directly in the database. The storage approach had silent RLS failures. Now photos resize to 200px, convert to JPEG, and save inline — no external storage needed.
- **Improved iOS photo picker.** Explicit MIME types give iOS Safari better access to the photo library.

---

## v1.1.2 — April 9, 2026

### Bug Fixes
- **Storage policy fix for avatars.** Made Supabase storage bucket public and added proper RLS policies (upload still failed silently — superseded by v1.1.3).

---

## v1.1.1 — April 9, 2026

### Bug Fixes
- **Fixed app crash (blank white screen) after login.** Supabase Realtime channels were reusing the same names across React re-renders, causing an uncaught "cannot add postgres_changes callbacks after subscribe()" error that killed the entire app.
- **Fixed Safari overflow CSS.** The overscroll-bounce prevention was applying to all Safari browsers instead of just standalone PWA mode.
- **Fixed render-blocking fonts.** Google Fonts now load asynchronously so the page renders immediately.
- **Fixed infinite loading spinner.** Data hooks no longer get stuck when the Zustand store hasn't hydrated yet.
- **Added auth guards.** Protected routes now redirect to login instead of rendering a blank shell.
- **Sign out works.** Now does a full page redirect to clear all state properly.

---

## v1.1.0 — April 8, 2026

### Bug Fixes
- **Parent overview now correctly shows chore completion status.** Fixed a bug where chores marked done and approved from the kid screen still showed as "0/5 done" on the parent overview. Root causes: weekly chores were shown every day regardless of assigned days, and date calculations used UTC instead of local time.
- **Weekly streak challenge counts correctly.** The Streak Squad challenge no longer shows a day as complete when only one kid out of two did their chores. Progress now requires ALL kids to complete ALL their chores for a day to count toward the streak.
- **Safari Home Screen no longer freezes.** Added web app manifest, switched from render-blocking Google Fonts import to non-blocking `@font-face` declarations with `font-display: swap`, and added Safari standalone mode viewport fixes.

### New Features
- **Day navigation on parent overview.** Parents can now tap forward/backward arrows to view chores for past and future days, not just today.
- **Edit and delete chores from overview.** Edit and delete buttons now appear on hover for each chore row in the parent overview (previously only available on the Chores page).
- **Profile pictures for kids.** Upload a photo for each kid in Settings. Photos appear in avatars across the app (chore rows, sidebar, history, etc.). Falls back to color initials if no photo is set.
- **Red badge notifications.** Parent nav (bottom bar + sidebar) now shows red badges: pending chore approvals on Overview, pending reward requests on Rewards.
- **Kid approved chore notification.** Kids see a green banner on their home screen when chores have been approved.
- **Reward wallet for kids.** The kid reward shop now has a "My Wallet" tab showing all claimed rewards and their status (Requested, Approved, Redeemed).
- **Parent reward fulfillment flow.** Parents can now approve/reject reward requests with action buttons, then mark approved rewards as "Given" once delivered.
- **Instrument practice chore icons.** Added piano, guitar, violin, drums, trumpet, saxophone, music notes, book, and pencil emojis to chore icon picker. Added preset chores for piano practice, guitar practice, and general instrument practice.

### Database Migration Required
- Run migration `016_avatar_url.sql` to add the `avatar_url` column to `duty_profiles`.

---

## v1.0.0 — Initial Release
Family chore tracking app with parent/kid roles, PIN login, daily/weekly/monthly recurring chores, points system, reward shop, photo proof, and weekly challenges.

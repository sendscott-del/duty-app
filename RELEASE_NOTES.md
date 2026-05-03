# Duty Release Notes

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

# Duty Release Notes

## v1.1.1 — April 8, 2026

### Bug Fixes
- **Fixed blank white screen on Safari.** The v1.1.0 CSS change that prevented overscroll bounce accidentally applied `overflow: hidden` to the body on ALL Safari browsers, not just standalone PWA mode. Now correctly scoped to `display-mode: standalone` only.
- **Fixed broken custom fonts.** Hardcoded Google Fonts woff2 URLs were returning 404. Reverted to the Google Fonts CSS API which always serves current URLs.

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

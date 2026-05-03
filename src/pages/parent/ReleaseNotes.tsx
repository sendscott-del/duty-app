import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const RELEASES = [
  {
    version: '1.5.0',
    date: 'May 2, 2026',
    fixes: [
      { title: 'Faster page loads', desc: 'Replaced per-row RLS policy function calls with a per-statement cached lookup. Pages with many rows now do a single function call per query instead of one per row.' },
    ],
    features: [
      'Kid scorecards on the Overview — each kid shows a 7-day completion rate, current streak, and a status pill (CRUSHING IT / KEEPING UP / SLIPPING). Tap a card to switch to that kid\'s view.',
    ],
  },
  {
    version: '1.4.2',
    date: 'May 2, 2026',
    fixes: [
      { title: 'Fixed parent login broken by v1.4.1', desc: 'The new profile read policy contained a self-referencing subquery that triggered infinite recursion in Postgres RLS, blocking the post-login profile fetch. Replaced with a SECURITY DEFINER helper that bypasses RLS for the caller\'s own family lookup.' },
    ],
    features: [],
  },
  {
    version: '1.4.1',
    date: 'May 2, 2026',
    fixes: [
      { title: 'Locked down database access', desc: 'Reworked every Duty RLS policy so parents only see their own family and kids can only do what they need (submit, undo before approval, redeem). Anon can no longer delete chores, change other families\' data, or award itself points.' },
      { title: 'Cross-app isolation', desc: 'Users signed in to other apps on the shared Supabase project can no longer touch Duty data.' },
      { title: 'Private chore storage', desc: 'chore-photos and chore-proofs buckets are now private with family-scoped access. Future proof uploads will use signed URLs.' },
    ],
    features: [],
  },
  {
    version: '1.4.0',
    date: 'May 1, 2026',
    fixes: [],
    features: [
      'Stadium redesign — completely new visual language. Loud, chunky, arcade-y. Cream backgrounds, hard-edge ink borders, chunky drop-shadows, three new typefaces (Bagel Fat One for shouts, Bricolage Grotesque for body, JetBrains Mono for numbers).',
      'Sir Flush mascot — new character throughout the app. Crowned-toilet inline SVG that scales infinitely. Appears on hero cards, login, celebrations, and the parent sidebar.',
      'Per-kid age skin — every kid has a "vibe" toggle in Settings. **Younger** (8–10) gets a big mascot, picture-first chore tiles, more confetti, "Flush it!" copy. **Teen** (11+) gets dark mode, stat-forward layout, dense rows, neutral copy.',
      'Celebrate overlay — completing a chore now triggers a full-screen confetti pop with Sir Flush.',
      'New Stadium primitives — PointChip, StreakBadge, StatCard, PinPad, Confetti, plus refreshed Button / Badge / Modal / Input / ProgressBar.',
      'Chunky redesign of every screen — Login, KidPin, KidHome, KidShop, Overview, Chores, Approvals, Rewards, History, Settings.',
    ],
  },
  {
    version: '1.3.0',
    date: 'April 20, 2026',
    fixes: [],
    features: [
      'Approvals queue — new Approvals tab collects every submitted chore across all dates in one place. Groups by day (Today, Yesterday, earlier), shows photo proof inline, and has per-row Approve / Reject / Clear actions.',
      'Approve all button — one tap approves every pending chore in the queue. Useful after being away.',
      'Pending-approvals tile on Overview now shows the total across all dates and is tappable to jump straight to the queue. It glows amber when there are items waiting.',
    ],
  },
  {
    version: '1.2.6',
    date: 'April 20, 2026',
    fixes: [{ title: 'Add Chore button reachable on iPhone', desc: 'Bottom sheet now respects the iOS safe area and dynamic toolbar.' }],
    features: [],
  },
  {
    version: '1.2.5',
    date: 'April 9, 2026',
    fixes: [
      { title: 'Fixed status bar overlap on mobile', desc: 'Content no longer hides behind the phone status bar.' },
      { title: 'Add Chore button works on mobile', desc: 'Button was covered by the status bar.' },
    ],
    features: [],
  },
  {
    version: '1.2.4',
    date: 'April 9, 2026',
    fixes: [],
    features: ['View as Kid on mobile — kid picker strip above the bottom nav lets you switch to any kid\'s view.'],
  },
  {
    version: '1.2.3',
    date: 'April 9, 2026',
    fixes: [],
    features: ['Mobile action sheet — tap any chore row to see all actions (Approve, Reject, Undo, Edit, Delete).'],
  },
  {
    version: '1.2.2',
    date: 'April 9, 2026',
    fixes: [],
    features: [
      'Reject chores — send a submitted chore back to the kid to redo.',
      'Undo approval — revert an approved chore and remove awarded points.',
      'Clear completion — fully reset a chore to pending.',
    ],
  },
  {
    version: '1.2.1',
    date: 'April 9, 2026',
    fixes: [
      { title: 'Auto-update for installed PWA', desc: 'App checks for updates every 60 seconds and reloads automatically.' },
      { title: 'Fixed service worker not loading', desc: 'Vercel rewrite was serving index.html instead of sw.js.' },
    ],
    features: [],
  },
  {
    version: '1.2.0',
    date: 'April 9, 2026',
    fixes: [],
    features: [
      'Push notifications — get notified when kids complete chores or request rewards.',
      'Kid notifications — kids get notified when their chores are approved.',
      'Notification settings — control whether you receive notifications from the Settings page.',
      'Install app guide — Settings now shows step-by-step instructions to install Duty as an app.',
      'App icon badge — shows pending approval count on the dock/home screen icon.',
    ],
  },
  {
    version: '1.1.3',
    date: 'April 9, 2026',
    fixes: [{ title: 'Fixed kid profile picture uploads', desc: 'Photos now resize client-side and save directly.' }],
    features: [],
  },
  {
    version: '1.1.2',
    date: 'April 9, 2026',
    fixes: [{ title: 'Storage policy fix for avatars', desc: 'Updated Supabase storage bucket and RLS policies.' }],
    features: [],
  },
  {
    version: '1.1.1',
    date: 'April 9, 2026',
    fixes: [
      { title: 'Fixed app crash after login', desc: 'Supabase Realtime channels were colliding on re-render.' },
      { title: 'Fixed Safari overflow CSS', desc: 'Overscroll bounce only applies in standalone PWA mode now.' },
      { title: 'Fixed render-blocking fonts', desc: 'Google Fonts load asynchronously.' },
      { title: 'Fixed infinite loading spinner', desc: 'Data hooks no longer stall before store hydration.' },
      { title: 'Added auth guards', desc: 'Protected routes redirect to login instead of blank screen.' },
      { title: 'Sign out works', desc: 'Full page redirect clears all state.' },
    ],
    features: [],
  },
  {
    version: '1.1.0',
    date: 'April 8, 2026',
    fixes: [
      { title: 'Chore completion status fixed', desc: 'Parent overview now correctly reflects done/approved chores.' },
      { title: 'Weekly streak counts correctly', desc: 'Streak Squad requires ALL kids to complete ALL chores for a day.' },
      { title: 'Safari Home Screen fixed', desc: 'No longer freezes with web app manifest and font fixes.' },
    ],
    features: [
      'Day navigation on parent overview',
      'Edit and delete chores from overview',
      'Profile pictures for kids',
      'Red badge notifications for approvals',
      'Kid approved chore notification',
      'Reward wallet for kids',
      'Parent reward fulfillment flow',
      'Instrument practice chore icons',
    ],
  },
  {
    version: '1.0.0',
    date: 'Initial Release',
    fixes: [],
    features: [
      'Family chore tracking with parent/kid roles',
      'PIN login for kids',
      'Daily, weekly, and monthly recurring chores',
      'Points system and reward shop',
      'Photo proof for chores',
      'Weekly family challenges',
    ],
  },
]

export function ReleaseNotes() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <Link to="/parent/settings" className="inline-flex items-center gap-1.5 text-xs font-bold mb-4" style={{ color: 'var(--ink)' }}>
        <ArrowLeft size={14} strokeWidth={3} /> Back to Settings
      </Link>
      <div className="stadium-eyebrow">CHANGELOG</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 24 }}>
        Release Notes
      </h1>

      <div className="space-y-4">
        {RELEASES.map(r => (
          <div key={r.version}
            style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-sm)', color: 'var(--ink)' }}>
            <div className="flex items-baseline gap-2 mb-3">
              <span style={{ background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--font-display)', fontSize: 16 }}>
                v{r.version}
              </span>
              <span className="stadium-eyebrow">{r.date}</span>
            </div>

            {r.fixes.length > 0 && (
              <div className="mb-3">
                <div className="stadium-eyebrow mb-1.5">BUG FIXES</div>
                <ul className="space-y-1.5">
                  {r.fixes.map((f, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--ink)' }}>
                      <strong>{f.title}.</strong> <span style={{ color: 'var(--ink-50)' }}>{f.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.features.length > 0 && (
              <div>
                <div className="stadium-eyebrow mb-1.5">NEW FEATURES</div>
                <ul className="space-y-1">
                  {r.features.map((f, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--ink)' }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

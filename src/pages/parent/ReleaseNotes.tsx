import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const RELEASES = [
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
    fixes: [
      { title: 'Add Chore button reachable on iPhone', desc: 'Bottom sheet now respects the iOS safe area and dynamic toolbar, so the Add Chore button is always scrollable into view. Header stays pinned while the form scrolls.' },
    ],
    features: [],
  },
  {
    version: '1.2.5',
    date: 'April 9, 2026',
    fixes: [
      { title: 'Fixed status bar overlap on mobile', desc: 'Content no longer hides behind the phone status bar (time, Wi-Fi, battery).' },
      { title: 'Add Chore button works on mobile', desc: 'Button was covered by the status bar.' },
    ],
    features: [],
  },
  {
    version: '1.2.4',
    date: 'April 9, 2026',
    fixes: [],
    features: [
      'View as Kid on mobile — kid picker strip above the bottom nav lets you switch to any kid\'s view.',
    ],
  },
  {
    version: '1.2.3',
    date: 'April 9, 2026',
    fixes: [],
    features: [
      'Mobile action sheet — tap any chore row to see all actions (Approve, Reject, Undo, Edit, Delete).',
    ],
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
      { title: 'Auto-update for installed PWA', desc: 'App checks for updates every 60 seconds and reloads automatically. No more manual reinstalls.' },
      { title: 'Fixed service worker not loading', desc: 'Vercel rewrite was serving index.html instead of sw.js.' },
    ],
    features: [],
  },
  {
    version: '1.2.0',
    date: 'April 9, 2026',
    fixes: [],
    features: [
      'Push notifications — get notified when kids complete chores or request rewards. Toggle on/off in Settings.',
      'Kid notifications — kids get notified when their chores are approved.',
      'Notification settings — control whether you receive notifications from the Settings page.',
      'Install app guide — Settings now shows step-by-step instructions to install Duty as an app on your phone or computer.',
      'App icon badge — shows pending approval count on the dock/home screen icon.',
    ],
  },
  {
    version: '1.1.3',
    date: 'April 9, 2026',
    fixes: [
      { title: 'Fixed kid profile picture uploads', desc: 'Photos now resize client-side and save directly — no more silent upload failures.' },
    ],
    features: [],
  },
  {
    version: '1.1.2',
    date: 'April 9, 2026',
    fixes: [
      { title: 'Storage policy fix for avatars', desc: 'Updated Supabase storage bucket and RLS policies.' },
    ],
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
      <Link to="/parent/settings" className="inline-flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--p-muted)' }}>
        <ArrowLeft size={14} /> Back to Settings
      </Link>
      <h1 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--p-text)' }}>Release Notes</h1>

      <div className="space-y-6">
        {RELEASES.map(r => (
          <div key={r.version} className="rounded-xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-display font-bold text-base" style={{ color: 'var(--gold)' }}>v{r.version}</span>
              <span className="text-xs" style={{ color: 'var(--p-dim)' }}>{r.date}</span>
            </div>

            {r.fixes.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: 'var(--p-dim)' }}>Bug Fixes</div>
                <ul className="space-y-1.5">
                  {r.fixes.map((f, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--p-text)' }}>
                      <span className="font-medium">{f.title}.</span>{' '}
                      <span style={{ color: 'var(--p-muted)' }}>{f.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.features.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-wider font-medium mb-1.5" style={{ color: 'var(--p-dim)' }}>New Features</div>
                <ul className="space-y-1">
                  {r.features.map((f, i) => (
                    <li key={i} className="text-sm" style={{ color: 'var(--p-text)' }}>{f}</li>
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

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'

interface Section {
  title: string
  items: string[]
}

const PARENT_SECTIONS: Section[] = [
  {
    title: 'Getting Started',
    items: [
      'Sign up with email/password and create your family name.',
      'Add your kids with a name, avatar color, optional profile photo, and 4-digit PIN.',
      'Create chores and rewards to get started.',
      'Share the Kid Login Link from Settings so kids can log in with their PIN — no email needed.',
    ],
  },
  {
    title: 'Overview',
    items: [
      "See today's chores across all kids with completion status.",
      'Tap left/right arrows to view past or future days.',
      'Stat cards show chores done, pending approvals, and total chores.',
      'Pick a weekly family challenge for bonus points.',
      'Red badges show how many chores need your approval.',
    ],
  },
  {
    title: 'Managing Chores',
    items: [
      'Tap "Add Chore" to pick from presets or create a custom chore.',
      'Hover over a chore row to edit (pencil) or delete (trash).',
      'Set recurrence: one-time, daily, weekly (pick days), or monthly.',
      'Optionally require photo proof from kids.',
      '30 emoji icons available including instruments, household items, and more.',
    ],
  },
  {
    title: 'Approving Chores',
    items: [
      'When a kid marks a chore done, it shows "Needs approval" with an amber badge.',
      'Tap the chore row to approve — points are awarded and confetti fires.',
      'Hover and tap undo to reverse an approval.',
      "Late completions are marked but don't earn points.",
    ],
  },
  {
    title: 'Rewards',
    items: [
      'Create rewards with a name, emoji, point cost, and type (experience, privilege, item, or Amazon).',
      'Use preset templates: screen time, stay up late, pick dinner, movie night, sleepover, $5 spending money.',
      'When kids claim a reward, approve or reject it from the Rewards page.',
      'After approving, tap "Mark Given" once you\'ve delivered the reward.',
    ],
  },
  {
    title: 'Weekly Challenges',
    items: [
      'Toilet Team Takedown — Complete 20 family chores this week.',
      'Streak Squad — Every kid keeps a 3+ day streak.',
      'No Clog Week — Zero missed chores all week.',
      'Mega Flush — Complete 30 family chores this week.',
      "Plumber's Marathon — Every kid hits a 5+ day streak.",
      'Bonus points are awarded to all kids when the challenge is completed.',
    ],
  },
  {
    title: 'Kid Profile Pictures',
    items: [
      'Go to Settings, tap the pencil icon next to a kid.',
      'Tap the camera icon on their avatar to upload a photo.',
      'Photos appear throughout the app in place of color initials.',
    ],
  },
  {
    title: 'Notifications',
    items: [
      'Toggle push notifications on or off in Settings.',
      'Get notified when a kid finishes a chore or requests a reward.',
      'Notifications work best when Duty is installed as an app.',
    ],
  },
  {
    title: 'Installing Duty as an App',
    items: [
      'iPhone/iPad: Open in Safari, tap Share, then "Add to Home Screen".',
      'Android: Tap the install banner or use the browser menu.',
      'Desktop (Chrome/Edge): Click the install icon in the address bar.',
      'Installing gives you app icon badges, notifications, and fullscreen mode.',
      'Settings will show install instructions if the app isn\'t installed yet.',
    ],
  },
]

const KID_SECTIONS: Section[] = [
  {
    title: 'Home Screen',
    items: [
      "See your chores for today with a progress bar.",
      'Swipe through days to see past or future chores.',
      'Tap a chore card once to see "Mark as done?", tap again to confirm.',
      'A green banner shows when parents have approved your chores.',
      'Your point balance shows in the top-right.',
    ],
  },
  {
    title: 'Reward Shop',
    items: [
      'Browse available rewards, sorted by what you can afford.',
      'Progress bars show how close you are to locked rewards.',
      'Tap "Claim" on any reward you can afford — points are deducted immediately.',
      'Check "My Wallet" to see all your claimed rewards and their status.',
    ],
  },
]

const TIPS: string[] = [
  'To add Duty to your iPhone home screen: open in Safari, tap Share, then "Add to Home Screen". It runs fullscreen like a native app.',
]

function CollapsibleSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-3 text-left"
      >
        {open ? <ChevronDown size={14} style={{ color: 'var(--p-dim)' }} /> : <ChevronRight size={14} style={{ color: 'var(--p-dim)' }} />}
        <span className="text-sm font-medium" style={{ color: 'var(--p-text)' }}>{section.title}</span>
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1.5 ml-5">
          {section.items.map((item, i) => (
            <li key={i} className="text-sm list-disc" style={{ color: 'var(--p-muted)' }}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Guide() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <Link to="/parent/settings" className="inline-flex items-center gap-1.5 text-xs mb-4" style={{ color: 'var(--p-muted)' }}>
        <ArrowLeft size={14} /> Back to Settings
      </Link>
      <h1 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--p-text)' }}>User Guide</h1>

      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--p-dim)' }}>For Parents</div>
        <div className="space-y-1.5">
          {PARENT_SECTIONS.map(s => <CollapsibleSection key={s.title} section={s} />)}
        </div>
      </div>

      <div className="mb-5">
        <div className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--p-dim)' }}>For Kids</div>
        <div className="space-y-1.5">
          {KID_SECTIONS.map(s => <CollapsibleSection key={s.title} section={s} />)}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--p-dim)' }}>Tips</div>
        <div className="rounded-lg p-3" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
          {TIPS.map((tip, i) => (
            <p key={i} className="text-sm" style={{ color: 'var(--p-muted)' }}>{tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

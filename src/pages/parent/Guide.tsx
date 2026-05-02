import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'

interface Section { title: string; items: string[] }

const PARENT_SECTIONS: Section[] = [
  { title: 'Getting Started', items: [
    'Sign up with email/password and create your family name.',
    'Add your kids with a name, avatar color, optional profile photo, and 4-digit PIN.',
    'Pick a "vibe" for each kid: Younger (8–10) or Teen (11+).',
    'Create chores and rewards to get started.',
    'Share the Kid Login Link from Settings so kids can log in with their PIN.',
  ]},
  { title: 'Stadium Skin (v1.4.0)', items: [
    'The whole app uses a new Stadium design language: cream backgrounds, chunky black borders, hard drop-shadows, and Sir Flush the mascot.',
    'Three typefaces: Bagel Fat One for shouts, Bricolage Grotesque for body text, JetBrains Mono for numbers.',
    'Each kid has their own visual skin: Younger or Teen. Set it in Settings → Kids → Vibe.',
    'Younger skin = big mascot, picture-first chore grid, "Flush it!" energy, more confetti.',
    'Teen skin = dark mode, dense stat rows, slim chore checkboxes, neutral copy.',
  ]},
  { title: 'Overview', items: [
    "See today's chores across all kids with completion status.",
    'Tap left/right arrows to view past or future days.',
    'Stat cards show chores done, pending approvals, total chores, and weekly challenge progress.',
    'Pick a weekly family challenge for bonus points.',
    'Red badges show how many chores need your approval.',
  ]},
  { title: 'Managing Chores', items: [
    'Tap "Add Chore" to pick from presets or create a custom chore.',
    'Tap the More button on any chore row to edit, delete, or change status.',
    'Set recurrence: one-time, daily, weekly (pick days), or monthly.',
    'Optionally require photo proof from kids.',
  ]},
  { title: 'Approving Chores', items: [
    'When a kid marks a chore done, it shows "Needs approval" with a yellow badge.',
    'Tap the chore row to approve — points are awarded and confetti fires.',
    'Use Approve All to clear the entire queue at once.',
    "Late completions are marked but don't earn points.",
  ]},
  { title: 'Rewards', items: [
    'Create rewards with a name, emoji, point cost, and type.',
    'Use preset templates: screen time, stay up late, pick dinner, movie night, sleepover.',
    'When kids claim a reward, approve or reject it from the Rewards page.',
    'After approving, tap "Mark Given" once you\'ve delivered the reward.',
  ]},
  { title: 'Notifications & Install', items: [
    'Toggle push notifications in Settings.',
    'Get notified when a kid finishes a chore or requests a reward.',
    'Install Duty as an app for app icon badges and fullscreen mode.',
    'iOS: open in Safari, Share, "Add to Home Screen".',
    'Android/Desktop: use the install prompt or browser menu.',
  ]},
]

const KID_SECTIONS: Section[] = [
  { title: 'Home Screen (Younger skin)', items: [
    'Big Sir Flush hero card shows how many chores are left.',
    'Chores appear as colorful tiles in a 2-column grid.',
    'Tap a tile once to see "Tap again!", tap again to confirm.',
    'Confetti pops for every chore completed.',
    'Reward shop strip at the bottom — tap to jump to the full shop.',
  ]},
  { title: 'Home Screen (Teen skin)', items: [
    'Dark UI with dense stat row at the top: today, balance, remaining.',
    'Chores are slim checkbox rows. Tap once to confirm, tap again to mark done.',
    'No confetti — just a quick "+points" overlay.',
    'Tab bar at the bottom (Home, Shop, Crew, Me).',
  ]},
  { title: 'Reward Shop', items: [
    'Browse available rewards, sorted by what you can afford.',
    'Locked rewards show a progress bar of how close you are.',
    'Tap "Get" / "Claim" on any reward you can afford.',
    'Check My Wallet to see all your claimed rewards and their status.',
  ]},
]

const TIPS: string[] = [
  'iPhone home screen: open in Safari → Share → Add to Home Screen.',
  'Each kid can have a different skin (Younger or Teen). Switch it in Settings.',
]

function CollapsibleSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 p-3 text-left">
        {open ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
        <span className="font-bold" style={{ color: 'var(--ink)' }}>{section.title}</span>
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1.5 ml-5">
          {section.items.map((item, i) => (
            <li key={i} className="text-sm list-disc font-bold" style={{ color: 'var(--ink-70)' }}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Guide() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <Link to="/parent/settings" className="inline-flex items-center gap-1.5 text-xs font-bold mb-4" style={{ color: 'var(--ink)' }}>
        <ArrowLeft size={14} strokeWidth={3} /> Back to Settings
      </Link>
      <div className="stadium-eyebrow">USER GUIDE</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 24 }}>
        How to Duty
      </h1>

      <div className="mb-5">
        <div className="stadium-eyebrow mb-2">FOR PARENTS</div>
        <div className="space-y-2">
          {PARENT_SECTIONS.map(s => <CollapsibleSection key={s.title} section={s} />)}
        </div>
      </div>

      <div className="mb-5">
        <div className="stadium-eyebrow mb-2">FOR KIDS</div>
        <div className="space-y-2">
          {KID_SECTIONS.map(s => <CollapsibleSection key={s.title} section={s} />)}
        </div>
      </div>

      <div>
        <div className="stadium-eyebrow mb-2">TIPS</div>
        <div style={{ background: 'var(--yellow)', border: '2.5px solid var(--ink)', borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-sm)' }}>
          {TIPS.map((tip, i) => (
            <p key={i} className="text-sm font-bold" style={{ color: 'var(--ink)' }}>• {tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

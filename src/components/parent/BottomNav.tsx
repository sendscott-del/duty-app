import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Gift, Clock, Settings } from 'lucide-react'

const TABS = [
  { to: '/parent/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/parent/chores', icon: ListChecks, label: 'Chores' },
  { to: '/parent/rewards', icon: Gift, label: 'Rewards' },
  { to: '/parent/history', icon: Clock, label: 'History' },
  { to: '/parent/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="flex h-14">
      {TABS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
        >
          {({ isActive }) => (
            <>
              <Icon size={20} style={{ color: isActive ? 'var(--gold)' : 'var(--p-dim)' }} />
              <span className="text-[10px]" style={{ color: isActive ? 'var(--gold)' : 'var(--p-dim)' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

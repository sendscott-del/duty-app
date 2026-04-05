import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Gift, Clock, Settings } from 'lucide-react'
import { useStore } from '../../lib/store'
import { Avatar } from '../ui/Avatar'
import { usePoints } from '../../hooks/usePoints'

const NAV = [
  { to: '/parent/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/parent/chores', icon: ListChecks, label: 'Chores' },
  { to: '/parent/rewards', icon: Gift, label: 'Rewards' },
  { to: '/parent/history', icon: Clock, label: 'History' },
  { to: '/parent/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { kids } = useStore()

  return (
    <div className="flex flex-col h-full w-[200px] border-r" style={{ background: 'var(--p-sidebar)', borderColor: 'var(--p-border)' }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="font-display text-xl font-extrabold" style={{ color: 'var(--gold)' }}>💩 Duty</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--p-dim)' }}>family chore hub</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'text-white bg-white/[0.06]'
                  : 'hover:bg-white/[0.04]'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--p-text)' : 'var(--p-muted)' })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Kids list */}
      <div className="px-3 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--p-border)' }}>
        <div className="px-3 text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--p-dim)' }}>Kids</div>
        {kids.map(kid => (
          <KidRow key={kid.id} kid={kid} />
        ))}
      </div>
    </div>
  )
}

function KidRow({ kid }: { kid: any }) {
  const { balance } = usePoints(kid.id)
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
      <Avatar name={kid.full_name} color={kid.avatar_color} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate" style={{ color: 'var(--p-text)' }}>{kid.full_name}</div>
      </div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--gold)' }}>{balance}</div>
    </div>
  )
}

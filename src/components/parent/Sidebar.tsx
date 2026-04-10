import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Gift, Clock, Settings, Eye } from 'lucide-react'
import { useStore } from '../../lib/store'
import { Avatar } from '../ui/Avatar'
import { usePoints } from '../../hooks/usePoints'
import { useCompletions } from '../../hooks/useCompletions'
import { useRewards } from '../../hooks/useRewards'

const NAV = [
  { to: '/parent/overview', icon: LayoutDashboard, label: 'Overview', badgeKey: 'chores' },
  { to: '/parent/chores', icon: ListChecks, label: 'Chores', badgeKey: null },
  { to: '/parent/rewards', icon: Gift, label: 'Rewards', badgeKey: 'rewards' },
  { to: '/parent/history', icon: Clock, label: 'History', badgeKey: null },
  { to: '/parent/settings', icon: Settings, label: 'Settings', badgeKey: null },
] as const

export function Sidebar() {
  const { kids, setViewAsKid } = useStore()
  const navigate = useNavigate()
  const { completions } = useCompletions()
  const { redemptions } = useRewards()

  const pendingApprovals = completions.filter(c => c.status === 'submitted').length
  const pendingRedemptions = redemptions.filter((r: any) => r.status === 'pending').length
  const badges: Record<string, number> = { chores: pendingApprovals, rewards: pendingRedemptions }

  function handleViewAsKid(kid: any) {
    setViewAsKid(kid)
    navigate('/kid')
  }

  return (
    <div className="flex flex-col h-full w-[200px] border-r" style={{ background: 'var(--p-sidebar)', borderColor: 'var(--p-border)' }}>
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Duty" className="w-9 h-9 rounded-lg" />
          <span className="font-display text-xl font-extrabold" style={{ color: 'var(--gold)' }}>Duty</span>
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--p-dim)' }}>family chore hub</div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'text-white bg-white/[0.06]' : 'hover:bg-white/[0.04]'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--p-text)' : 'var(--p-muted)' })}
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {badgeKey && badges[badgeKey] > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: 'var(--red)' }}>
                {badges[badgeKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--p-border)' }}>
        <div className="px-3 text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--p-dim)' }}>Kids</div>
        {kids.map(kid => (
          <KidRow key={kid.id} kid={kid} onViewAs={() => handleViewAsKid(kid)} />
        ))}
      </div>
    </div>
  )
}

function KidRow({ kid, onViewAs }: { kid: any; onViewAs: () => void }) {
  const { balance } = usePoints(kid.id)
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg group">
      <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-xs truncate" style={{ color: 'var(--p-text)' }}>{kid.full_name}</div>
      </div>
      <div className="text-[11px] font-medium" style={{ color: 'var(--gold)' }}>{balance}</div>
      <button
        onClick={onViewAs}
        className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'var(--p-muted)' }}
        title={`View as ${kid.full_name}`}
      >
        <Eye size={12} />
      </button>
    </div>
  )
}

import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Gift, Clock, Settings, Eye } from 'lucide-react'
import { useCompletions } from '../../hooks/useCompletions'
import { useRewards } from '../../hooks/useRewards'
import { useStore } from '../../lib/store'
import { Avatar } from '../ui/Avatar'

const TABS = [
  { to: '/parent/overview', icon: LayoutDashboard, label: 'Overview', badgeKey: 'chores' },
  { to: '/parent/chores', icon: ListChecks, label: 'Chores', badgeKey: null },
  { to: '/parent/rewards', icon: Gift, label: 'Rewards', badgeKey: 'rewards' },
  { to: '/parent/history', icon: Clock, label: 'History', badgeKey: null },
  { to: '/parent/settings', icon: Settings, label: 'Settings', badgeKey: null },
] as const

export function BottomNav() {
  const { completions } = useCompletions()
  const { redemptions } = useRewards()
  const { kids, setViewAsKid } = useStore()
  const navigate = useNavigate()

  const pendingApprovals = completions.filter(c => c.status === 'submitted').length
  const pendingRedemptions = redemptions.filter((r: any) => r.status === 'pending').length

  const badges: Record<string, number> = {
    chores: pendingApprovals,
    rewards: pendingRedemptions,
  }

  function handleViewAsKid(kid: any) {
    setViewAsKid(kid)
    navigate('/kid')
  }

  return (
    <div>
      {/* Kid strip */}
      {kids.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b" style={{ borderColor: 'var(--p-border)' }}>
          <Eye size={10} style={{ color: 'var(--p-dim)' }} />
          <span className="text-[10px] mr-1" style={{ color: 'var(--p-dim)' }}>View as</span>
          {kids.map(kid => (
            <button
              key={kid.id}
              onClick={() => handleViewAsKid(kid)}
              className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors active:bg-white/[0.06]"
              style={{ background: 'var(--p-card)' }}
            >
              <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
              <span className="text-[10px]" style={{ color: 'var(--p-text)' }}>{kid.full_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}
      <nav className="flex h-14">
      {TABS.map(({ to, icon: Icon, label, badgeKey }) => (
        <NavLink
          key={to}
          to={to}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={20} style={{ color: isActive ? 'var(--gold)' : 'var(--p-dim)' }} />
                {badgeKey && badges[badgeKey] > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'var(--red)' }}>
                    {badges[badgeKey]}
                  </span>
                )}
              </div>
              <span className="text-[10px]" style={{ color: isActive ? 'var(--gold)' : 'var(--p-dim)' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
    </div>
  )
}

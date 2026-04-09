import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Gift, Clock, Settings } from 'lucide-react'
import { useCompletions } from '../../hooks/useCompletions'
import { useRewards } from '../../hooks/useRewards'

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

  const pendingApprovals = completions.filter(c => c.status === 'submitted').length
  const pendingRedemptions = redemptions.filter((r: any) => r.status === 'pending').length

  const badges: Record<string, number> = {
    chores: pendingApprovals,
    rewards: pendingRedemptions,
  }

  return (
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
  )
}

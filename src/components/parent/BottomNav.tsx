import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Inbox, Gift, Clock, Settings, Eye } from 'lucide-react'
import { useCompletions } from '../../hooks/useCompletions'
import { useRewards } from '../../hooks/useRewards'
import { useStore } from '../../lib/store'
import { Avatar } from '../ui/Avatar'

const TABS = [
  { to: '/parent/overview',  icon: LayoutDashboard, label: 'Overview',  badgeKey: null },
  { to: '/parent/approvals', icon: Inbox,           label: 'Approvals', badgeKey: 'approvals' },
  { to: '/parent/chores',    icon: ListChecks,      label: 'Chores',    badgeKey: null },
  { to: '/parent/rewards',   icon: Gift,            label: 'Rewards',   badgeKey: 'rewards' },
  { to: '/parent/history',   icon: Clock,           label: 'History',   badgeKey: null },
  { to: '/parent/settings',  icon: Settings,        label: 'Settings',  badgeKey: null },
] as const

export function BottomNav() {
  const { completions } = useCompletions()
  const { redemptions } = useRewards()
  const { kids, setViewAsKid } = useStore()
  const navigate = useNavigate()

  const badges: Record<string, number> = {
    approvals: completions.filter(c => c.status === 'submitted').length,
    rewards: redemptions.filter((r: any) => r.status === 'pending').length,
  }

  function handleViewAsKid(kid: any) {
    setViewAsKid(kid)
    navigate('/kid')
  }

  return (
    <div>
      {kids.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scroll-hide" style={{ borderBottom: '2px solid var(--ink)', background: 'var(--cream)' }}>
          <Eye size={11} strokeWidth={3} style={{ color: 'var(--ink)' }} />
          <span className="stadium-eyebrow mr-1">VIEW AS</span>
          {kids.map(kid => (
            <button
              key={kid.id}
              onClick={() => handleViewAsKid(kid)}
              className="flex items-center gap-1 transition-transform active:scale-95"
              style={{
                background: '#fff',
                border: '2px solid var(--ink)',
                borderRadius: 999,
                padding: '3px 10px 3px 3px',
                flexShrink: 0,
              }}
            >
              <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
              <span className="text-xs font-bold" style={{ color: 'var(--ink)' }}>{kid.full_name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}
      <nav className="flex h-16" style={{ background: 'var(--ink)' }}>
        {TABS.map(({ to, icon: Icon, label, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 relative"
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={18} strokeWidth={isActive ? 3 : 2} style={{ color: isActive ? 'var(--yellow)' : 'rgba(255,247,230,0.45)' }} />
                  {badgeKey && badges[badgeKey] > 0 && (
                    <span style={{ position: 'absolute', top: -6, right: -8, background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 9, padding: '1px 5px', borderRadius: 8, border: '1.5px solid var(--ink)' }}>
                      {badges[badgeKey]}
                    </span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: 1, color: isActive ? 'var(--yellow)' : 'rgba(255,247,230,0.45)' }}>
                  {label.toUpperCase()}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

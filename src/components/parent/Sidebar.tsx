import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Inbox, Gift, Clock, Settings, Eye } from 'lucide-react'
import { useStore } from '../../lib/store'
import { Avatar } from '../ui/Avatar'
import { SirFlush } from '../ui/SirFlush'
import { usePoints } from '../../hooks/usePoints'
import { useCompletions } from '../../hooks/useCompletions'
import { useRewards } from '../../hooks/useRewards'

const NAV = [
  { to: '/parent/overview',  icon: LayoutDashboard, label: 'Overview',  badgeKey: null },
  { to: '/parent/approvals', icon: Inbox,           label: 'Approvals', badgeKey: 'approvals' },
  { to: '/parent/chores',    icon: ListChecks,      label: 'Chores',    badgeKey: null },
  { to: '/parent/rewards',   icon: Gift,            label: 'Rewards',   badgeKey: 'rewards' },
  { to: '/parent/history',   icon: Clock,           label: 'History',   badgeKey: null },
  { to: '/parent/settings',  icon: Settings,        label: 'Settings',  badgeKey: null },
] as const

export function Sidebar() {
  const { kids, setViewAsKid } = useStore()
  const navigate = useNavigate()
  const { completions } = useCompletions()
  const { redemptions } = useRewards()

  const pendingApprovals = completions.filter(c => c.status === 'submitted').length
  const pendingRedemptions = redemptions.filter((r: any) => r.status === 'pending').length
  const badges: Record<string, number> = { approvals: pendingApprovals, rewards: pendingRedemptions }

  function handleViewAsKid(kid: any) {
    setViewAsKid(kid)
    navigate('/kid')
  }

  return (
    <div className="flex flex-col h-full w-[220px]" style={{ background: 'var(--ink)', borderRight: '3px solid var(--ink)' }}>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <SirFlush size={36} expression="wink" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--yellow)', letterSpacing: '-0.04em' }}>DUTY</span>
        </div>
        <div className="stadium-eyebrow mt-1" style={{ color: 'rgba(255,247,230,0.55)' }}>FAMILY CHORE HUB</div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg ${isActive ? '' : 'opacity-70 hover:opacity-100'}`}
            style={({ isActive }) => ({
              background: isActive ? 'var(--yellow)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'rgba(255,247,230,0.85)',
              fontWeight: isActive ? 800 : 600,
            })}
          >
            <Icon size={16} strokeWidth={2.5} />
            <span className="flex-1">{label}</span>
            {badgeKey && badges[badgeKey] > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 10, padding: '2px 6px', borderRadius: 8, border: '1.5px solid var(--ink)' }}>
                {badges[badgeKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 space-y-1 pt-3" style={{ borderTop: '1px solid rgba(255,247,230,0.15)' }}>
        <div className="stadium-eyebrow px-3 mb-2" style={{ color: 'rgba(255,247,230,0.45)' }}>KIDS</div>
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
    <div className="flex items-center gap-2 px-3 py-1.5 group">
      <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold truncate" style={{ color: 'rgba(255,247,230,0.92)' }}>{kid.full_name}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--yellow)' }}>{balance}</div>
      <button
        onClick={onViewAs}
        className="p-1 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: 'rgba(255,247,230,0.7)' }}
        title={`View as ${kid.full_name}`}
      >
        <Eye size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}

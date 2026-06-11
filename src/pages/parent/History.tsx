import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { usePoints } from '../../hooks/usePoints'
import { Avatar } from '../../components/ui/Avatar'
import { Spinner } from '../../components/ui/Spinner'
import { useStore } from '../../lib/store'
import { usePremium } from '../../hooks/usePremium'

const FREE_HISTORY_DAYS = 30

export function History() {
  const { transactions, loading } = usePoints()
  const { kids } = useStore()
  const { isPremium } = usePremium()
  const kidMap = useMemo(() => new Map(kids.map(k => [k.id, k])), [kids])

  const cutoff = useMemo(() => {
    if (isPremium) return null
    const d = new Date()
    d.setDate(d.getDate() - FREE_HISTORY_DAYS)
    return d
  }, [isPremium])

  const visible = useMemo(
    () => cutoff ? transactions.filter(t => new Date(t.created_at) >= cutoff) : transactions,
    [transactions, cutoff],
  )

  const hiddenCount = transactions.length - visible.length

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="stadium-eyebrow">HISTORY</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 24 }}>
        Point ledger
      </h1>

      {visible.length === 0 ? (
        <div className="text-center py-12 font-bold" style={{ color: 'var(--ink-50)' }}>
          Nothing here yet. Get those kids moving.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(t => {
            const kid = kidMap.get(t.profile_id)
            return (
              <div key={t.id} className="flex items-center gap-3" style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 12, padding: 12, boxShadow: 'var(--shadow-sm)', color: 'var(--ink)' }}>
                {kid && <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />}
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{t.reason}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18,
                    color: t.amount > 0 ? 'var(--green)' : 'var(--red)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isPremium && hiddenCount > 0 && (
        <Link
          to="/parent/upgrade"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 14, background: 'var(--ink)', color: 'var(--yellow)',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            padding: 14, boxShadow: 'var(--shadow-sm)', textDecoration: 'none',
          }}
        >
          <Lock size={16} strokeWidth={3} />
          <div className="flex-1">
            <div className="font-bold text-sm">{hiddenCount} older entries hidden</div>
            <div className="text-xs font-bold" style={{ color: 'rgba(255,247,230,0.7)' }}>
              Premium shows 90-day history · Tap to upgrade
            </div>
          </div>
        </Link>
      )}

      {!isPremium && hiddenCount === 0 && transactions.length > 0 && (
        <Link
          to="/parent/upgrade"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginTop: 14, background: 'var(--cream)', color: 'var(--ink)',
            border: '2.5px solid var(--ink)', borderRadius: 12,
            padding: 12, boxShadow: 'var(--shadow-sm)', textDecoration: 'none',
          }}
        >
          <Lock size={14} strokeWidth={3} style={{ color: 'var(--ink-50)' }} />
          <div className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>
            Showing last 30 days · Premium unlocks 90-day history
          </div>
        </Link>
      )}
    </div>
  )
}

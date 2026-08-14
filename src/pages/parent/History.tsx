import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { usePoints } from '../../hooks/usePoints'
import { Avatar } from '../../components/ui/Avatar'
import { PointChip } from '../../components/ui/PointChip'
import { Spinner } from '../../components/ui/Spinner'
import { useStore } from '../../lib/store'
import { usePremium } from '../../hooks/usePremium'
import { isNativeApp } from '../../lib/platform'

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

  // Balances come from the FULL ledger, not the visible window — the free plan
  // hides rows older than 30 days, which must not skew the totals.
  const balances = useMemo(() => {
    const m = new Map<string, number>()
    for (const k of kids) m.set(k.id, 0)
    for (const t of transactions) {
      if (m.has(t.profile_id)) m.set(t.profile_id, m.get(t.profile_id)! + t.amount)
    }
    return kids.map(k => ({ kid: k, balance: m.get(k.id) ?? 0 }))
  }, [kids, transactions])

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="stadium-eyebrow">HISTORY</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 24 }}>
        Point ledger
      </h1>

      {balances.length > 0 && (
        <div className="mb-6">
          <div className="stadium-eyebrow mb-2">CURRENT BALANCES</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {balances.map(({ kid, balance }) => (
              <div
                key={kid.id}
                className="flex items-center gap-3"
                style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 12, padding: '10px 12px', boxShadow: 'var(--shadow-sm)', color: 'var(--ink)' }}
              >
                <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
                <div className="flex-1 min-w-0 font-bold truncate">{kid.full_name.split(' ')[0]}</div>
                <PointChip points={balance} size="sm" animate={false} />
              </div>
            ))}
          </div>
        </div>
      )}

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

      {!isPremium && !isNativeApp && hiddenCount > 0 && (
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
              Premium shows your full history · Tap to upgrade
            </div>
          </div>
        </Link>
      )}

      {!isPremium && !isNativeApp && hiddenCount === 0 && transactions.length > 0 && (
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
            Showing last 30 days · Premium unlocks full history
          </div>
        </Link>
      )}
    </div>
  )
}

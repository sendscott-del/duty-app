import { usePoints } from '../../hooks/usePoints'
import { Avatar } from '../../components/ui/Avatar'
import { Spinner } from '../../components/ui/Spinner'
import { useStore } from '../../lib/store'

export function History() {
  const { transactions, loading } = usePoints()
  const { kids } = useStore()

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="stadium-eyebrow">HISTORY</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 24 }}>
        Point ledger
      </h1>

      {transactions.length === 0 ? (
        <div className="text-center py-12 font-bold" style={{ color: 'var(--ink-50)' }}>
          Nothing here yet. Get those kids moving.
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(t => {
            const kid = kids.find(k => k.id === t.profile_id)
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
    </div>
  )
}

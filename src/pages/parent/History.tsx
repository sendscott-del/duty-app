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
      <h1 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--p-text)' }}>History</h1>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          Nothing here yet. Get those kids moving.
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.map(t => {
            const kid = kids.find(k => k.id === t.profile_id)
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--p-card)' }}>
                {kid && <Avatar name={kid.full_name} color={kid.avatar_color} size="sm" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: 'var(--p-text)' }}>{t.reason}</div>
                  <div className="text-[11px]" style={{ color: 'var(--p-muted)' }}>
                    {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: t.amount > 0 ? 'var(--green)' : 'var(--amber)' }}>
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

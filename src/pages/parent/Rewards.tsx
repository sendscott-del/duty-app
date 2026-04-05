import { useRewards } from '../../hooks/useRewards'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { Plus } from 'lucide-react'

export function Rewards() {
  const { rewards, redemptions, loading } = useRewards()
  const pending = redemptions.filter(r => r.status === 'pending')

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Rewards</h1>
        <Button><Plus size={16} /> Add Reward</Button>
      </div>

      {/* Pending redemptions */}
      {pending.length > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--amber)' }}>
            {pending.length} pending {pending.length === 1 ? 'redemption' : 'redemptions'}
          </div>
          {pending.map(r => (
            <div key={r.id} className="text-sm py-1" style={{ color: 'var(--p-text)' }}>
              {r.profiles?.full_name} wants {r.rewards?.name} ({r.rewards?.emoji})
            </div>
          ))}
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          Add some rewards so they have something to work toward.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map(reward => (
            <div key={reward.id} className="rounded-xl p-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
              <div className="text-3xl mb-2">{reward.emoji}</div>
              <div className="text-sm font-medium" style={{ color: 'var(--p-text)' }}>{reward.name}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="gold">{reward.points_cost} pts</Badge>
                <Badge variant="muted">{reward.reward_type}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

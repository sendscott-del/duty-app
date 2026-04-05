import { useState } from 'react'
import { useRewards } from '../../hooks/useRewards'
import { supabase } from '../../lib/supabase'
import { AddRewardSheet } from '../../components/parent/AddRewardSheet'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export function Rewards() {
  const { rewards, redemptions, loading } = useRewards()
  const [showAdd, setShowAdd] = useState(false)
  const [editReward, setEditReward] = useState<any>(null)
  const pending = redemptions.filter((r: any) => r.status === 'pending')

  async function handleDelete(reward: any) {
    if (!window.confirm(`Delete "${reward.name}"?`)) return
    await supabase.from('duty_rewards').update({ is_active: false }).eq('id', reward.id)
  }

  function handleEdit(reward: any) {
    setEditReward(reward)
    setShowAdd(true)
  }

  function handleClose() {
    setShowAdd(false)
    setEditReward(null)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Rewards</h1>
        <Button onClick={() => { setEditReward(null); setShowAdd(true) }}><Plus size={16} /> Add Reward</Button>
      </div>

      {pending.length > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--amber)' }}>
            {pending.length} pending {pending.length === 1 ? 'redemption' : 'redemptions'}
          </div>
          {pending.map((r: any) => (
            <div key={r.id} className="text-sm py-1" style={{ color: 'var(--p-text)' }}>
              {r.duty_profiles?.full_name} wants {r.duty_rewards?.name} ({r.duty_rewards?.emoji})
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
          {rewards.map((reward: any) => (
            <div key={reward.id} className="rounded-xl p-4 group relative" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
              <div className="text-3xl mb-2">{reward.emoji}</div>
              <div className="text-sm font-medium" style={{ color: 'var(--p-text)' }}>{reward.name}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="gold">{reward.points_cost} pts</Badge>
                <Badge variant="muted">{reward.reward_type}</Badge>
              </div>
              {/* Edit / Delete */}
              <div className="flex gap-1 mt-3">
                <button
                  onClick={() => handleEdit(reward)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors"
                  style={{ color: 'var(--p-muted)', background: 'var(--p-card)' }}
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(reward)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors"
                  style={{ color: 'var(--red)' }}
                >
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddRewardSheet open={showAdd} onClose={handleClose} onSaved={() => {}} editReward={editReward} />
    </div>
  )
}

import { useState } from 'react'
import { useRewards } from '../../hooks/useRewards'
import { supabase } from '../../lib/supabase'
import { AddRewardSheet } from '../../components/parent/AddRewardSheet'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { Plus, Pencil, Trash2, Check, X, Gift } from 'lucide-react'

export function Rewards() {
  const { rewards, redemptions, loading } = useRewards()
  const [showAdd, setShowAdd] = useState(false)
  const [editReward, setEditReward] = useState<any>(null)
  const pending = redemptions.filter((r: any) => r.status === 'pending')
  const approved = redemptions.filter((r: any) => r.status === 'approved')

  async function handleApproveRedemption(id: string) {
    await supabase.from('duty_redemptions').update({ status: 'approved' }).eq('id', id)
  }

  async function handleFulfillRedemption(id: string) {
    await supabase.from('duty_redemptions').update({ status: 'fulfilled' }).eq('id', id)
  }

  async function handleRejectRedemption(id: string) {
    if (!window.confirm('Reject this reward request? Points will not be refunded.')) return
    await supabase.from('duty_redemptions').update({ status: 'rejected' }).eq('id', id)
  }

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
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--amber)' }}>
            {pending.length} pending {pending.length === 1 ? 'request' : 'requests'}
          </div>
          {pending.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 py-2">
              <div className="text-xl">{r.duty_rewards?.emoji || '🎁'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: 'var(--p-text)' }}>
                  {r.duty_profiles?.full_name} wants <strong>{r.duty_rewards?.name}</strong>
                </div>
                <div className="text-[11px]" style={{ color: 'var(--p-muted)' }}>{r.points_spent} pts</div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleApproveRedemption(r.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--green)', background: 'var(--green-dim)' }}
                  title="Approve"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => handleRejectRedemption(r.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--red)' }}
                  title="Reject"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-border)' }}>
          <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--gold)' }}>
            {approved.length} approved — ready to give
          </div>
          {approved.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 py-2">
              <div className="text-xl">{r.duty_rewards?.emoji || '🎁'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: 'var(--p-text)' }}>
                  {r.duty_profiles?.full_name} — <strong>{r.duty_rewards?.name}</strong>
                </div>
              </div>
              <button
                onClick={() => handleFulfillRedemption(r.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid var(--green-border)' }}
              >
                <Gift size={12} /> Mark Given
              </button>
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

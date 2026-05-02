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
  function handleEdit(reward: any) { setEditReward(reward); setShowAdd(true) }
  function handleClose() { setShowAdd(false); setEditReward(null) }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="stadium-eyebrow">REWARDS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4 }}>The shop</h1>
        </div>
        <Button onClick={() => { setEditReward(null); setShowAdd(true) }}>
          <Plus size={16} strokeWidth={3} /> ADD REWARD
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="mb-6" style={{ background: 'var(--yellow)', border: '3px solid var(--ink)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div className="stadium-eyebrow mb-3" style={{ color: 'var(--ink)' }}>
            {pending.length} PENDING {pending.length === 1 ? 'REQUEST' : 'REQUESTS'}
          </div>
          {pending.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 py-2">
              <div className="text-2xl">{r.duty_rewards?.emoji || '🎁'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold" style={{ color: 'var(--ink)' }}>
                  {r.duty_profiles?.full_name} wants <strong>{r.duty_rewards?.name}</strong>
                </div>
                <div className="text-xs font-bold" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>{r.points_spent} pts</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => handleApproveRedemption(r.id)} title="Approve"
                  style={{ background: 'var(--green)', color: '#fff', border: '2.5px solid var(--ink)', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                  <Check size={14} strokeWidth={3} />
                </button>
                <button onClick={() => handleRejectRedemption(r.id)} title="Reject"
                  style={{ background: 'var(--red)', color: '#fff', border: '2.5px solid var(--ink)', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="mb-6" style={{ background: 'var(--green)', border: '3px solid var(--ink)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)', color: '#fff' }}>
          <div className="stadium-eyebrow mb-3" style={{ color: '#fff', opacity: 0.85 }}>
            {approved.length} APPROVED — READY TO GIVE
          </div>
          {approved.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 py-2">
              <div className="text-2xl">{r.duty_rewards?.emoji || '🎁'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold">
                  {r.duty_profiles?.full_name} — <strong>{r.duty_rewards?.name}</strong>
                </div>
              </div>
              <button onClick={() => handleFulfillRedemption(r.id)}
                style={{ background: '#fff', color: 'var(--ink)', border: '2.5px solid var(--ink)', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <Gift size={12} strokeWidth={3} /> Mark Given
              </button>
            </div>
          ))}
        </div>
      )}

      {rewards.length === 0 ? (
        <div className="text-center py-12 font-bold" style={{ color: 'var(--ink-50)' }}>
          Add some rewards so they have something to work toward.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map((reward: any) => (
            <div key={reward.id} style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)', color: 'var(--ink)' }}>
              <div className="text-3xl mb-2">{reward.emoji}</div>
              <div className="font-bold">{reward.name}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="gold">{reward.points_cost} pts</Badge>
                <Badge variant="muted">{reward.reward_type}</Badge>
              </div>
              <div className="flex gap-1 mt-3">
                <button onClick={() => handleEdit(reward)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <Pencil size={11} strokeWidth={3} /> Edit
                </button>
                <button onClick={() => handleDelete(reward)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--red)', color: '#fff', border: '2px solid var(--ink)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  <Trash2 size={11} strokeWidth={3} /> Delete
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

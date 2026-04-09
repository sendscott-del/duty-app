import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, Gift, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { useRewards } from '../../hooks/useRewards'
import { usePoints } from '../../hooks/usePoints'
import { RewardCard } from '../../components/kid/RewardCard'
import { CoinsPill } from '../../components/kid/CoinsPill'
import { Badge } from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

export function KidShop() {
  const { profile } = useStore()
  const { rewards, redemptions } = useRewards()
  const { balance } = usePoints(profile?.id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'shop' | 'wallet'>('shop')

  // My redemptions (pending + approved/fulfilled)
  const myRedemptions = redemptions.filter((r: any) => r.redeemed_by === profile?.id || r.duty_profiles?.id === profile?.id)

  async function handleClaim(reward: any) {
    if (!profile || balance < reward.points_cost) return

    if (!window.confirm(`Spend ${reward.points_cost} pts on ${reward.name}?`)) return

    await supabase.from('duty_redemptions').insert({
      family_id: profile.family_id,
      reward_id: reward.id,
      redeemed_by: profile.id,
      points_spent: reward.points_cost,
      status: 'pending',
    })

    await supabase.from('duty_point_transactions').insert({
      family_id: profile.family_id,
      profile_id: profile.id,
      amount: -reward.points_cost,
      reason: `Redeemed: ${reward.name}`,
      reference_id: reward.id,
      reference_type: 'redemption',
      created_by: profile.id,
    })
  }

  // Sort: available first
  const sorted = [...rewards].sort((a, b) => {
    const aCanAfford = balance >= a.points_cost ? 0 : 1
    const bCanAfford = balance >= b.points_cost ? 0 : 1
    return aCanAfford - bCanAfford || a.points_cost - b.points_cost
  })

  const STATUS_LABELS: Record<string, { label: string; variant: 'amber' | 'green' | 'gold' | 'muted' }> = {
    pending: { label: 'Requested', variant: 'amber' },
    approved: { label: 'Approved', variant: 'gold' },
    fulfilled: { label: 'Redeemed', variant: 'green' },
    rejected: { label: 'Denied', variant: 'muted' },
  }

  return (
    <div className="flex-1 px-5 pb-8">
      <div className="flex items-center justify-between pt-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/kid')} className="p-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Rewards</h1>
        </div>
        <CoinsPill points={balance} />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('shop')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors"
          style={{
            background: tab === 'shop' ? 'var(--gold-dim)' : 'rgba(255,255,255,0.06)',
            color: tab === 'shop' ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${tab === 'shop' ? 'var(--gold-border)' : 'transparent'}`,
          }}
        >
          <Gift size={13} /> Shop
        </button>
        <button
          onClick={() => setTab('wallet')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-colors relative"
          style={{
            background: tab === 'wallet' ? 'var(--gold-dim)' : 'rgba(255,255,255,0.06)',
            color: tab === 'wallet' ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
            border: `1px solid ${tab === 'wallet' ? 'var(--gold-border)' : 'transparent'}`,
          }}
        >
          <Wallet size={13} /> My Wallet
          {myRedemptions.filter((r: any) => r.status === 'approved').length > 0 && (
            <span className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5" style={{ background: 'var(--green)' }} />
          )}
        </button>
      </div>

      {tab === 'shop' ? (
        sorted.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No rewards yet. Check back soon!
          </div>
        ) : (
          <motion.div variants={list} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
            {sorted.map(reward => (
              <motion.div key={reward.id} variants={item}>
                <RewardCard reward={reward} balance={balance} onClaim={handleClaim} />
              </motion.div>
            ))}
          </motion.div>
        )
      ) : (
        myRedemptions.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            No rewards claimed yet. Hit the shop!
          </div>
        ) : (
          <div className="space-y-2">
            {myRedemptions.map((r: any) => {
              const reward = r.duty_rewards
              const st = STATUS_LABELS[r.status] || STATUS_LABELS.pending
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl">{reward?.emoji || '🎁'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{reward?.name || 'Reward'}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {r.points_spent} pts · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={st.variant}>
                    {r.status === 'fulfilled' && <Check size={10} className="mr-0.5" />}
                    {st.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

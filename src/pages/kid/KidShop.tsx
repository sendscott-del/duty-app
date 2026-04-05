import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { useRewards } from '../../hooks/useRewards'
import { usePoints } from '../../hooks/usePoints'
import { RewardCard } from '../../components/kid/RewardCard'
import { CoinsPill } from '../../components/kid/CoinsPill'
import { supabase } from '../../lib/supabase'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

export function KidShop() {
  const { profile } = useStore()
  const { rewards } = useRewards()
  const { balance } = usePoints(profile?.id)
  const navigate = useNavigate()

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

  return (
    <div className="flex-1 px-5 pb-8">
      <div className="flex items-center justify-between pt-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/kid')} className="p-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Reward Shop</h1>
        </div>
        <CoinsPill points={balance} />
      </div>

      {sorted.length === 0 ? (
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
      )}
    </div>
  )
}

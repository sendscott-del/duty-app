import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, Gift, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { useRewards } from '../../hooks/useRewards'
import { usePoints } from '../../hooks/usePoints'
import { RewardCard } from '../../components/kid/RewardCard'
import { PointChip } from '../../components/ui/PointChip'
import { Badge } from '../../components/ui/Badge'
import { useKidSkin } from '../../hooks/useKidSkin'
import { supabase } from '../../lib/supabase'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

export function KidShop() {
  const { profile } = useStore()
  const { rewards, redemptions } = useRewards()
  const { balance } = usePoints(profile?.id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'shop' | 'wallet'>('shop')
  const [skin] = useKidSkin(profile?.id)
  const isTeen = skin === 'teen'

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

  const sorted = [...rewards].sort((a, b) => {
    const aCanAfford = balance >= a.points_cost ? 0 : 1
    const bCanAfford = balance >= b.points_cost ? 0 : 1
    return aCanAfford - bCanAfford || a.points_cost - b.points_cost
  })

  const STATUS: Record<string, { label: string; variant: any }> = {
    pending:   { label: 'Requested', variant: 'amber' },
    approved:  { label: 'Approved',  variant: 'gold' },
    fulfilled: { label: 'Redeemed',  variant: 'green' },
    rejected:  { label: 'Denied',    variant: 'muted' },
  }

  return (
    <div className="flex-1 px-5 pb-8" style={isTeen ? { color: '#fff' } : undefined}>
      {/* Header */}
      <div className="flex items-center justify-between pt-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/kid')} style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 8, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}>
            <ArrowLeft size={16} strokeWidth={3} />
          </button>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              letterSpacing: '-0.03em',
              color: isTeen ? '#fff' : 'var(--ink)',
              textShadow: isTeen ? 'none' : '3px 3px 0 var(--yellow)',
              lineHeight: 1,
            }}
          >
            SHOP
          </h1>
        </div>
        <PointChip points={balance} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <TabBtn active={tab === 'shop'} onClick={() => setTab('shop')} icon={<Gift size={13} strokeWidth={3} />} label="Shop" />
        <TabBtn
          active={tab === 'wallet'}
          onClick={() => setTab('wallet')}
          icon={<Wallet size={13} strokeWidth={3} />}
          label="My Wallet"
          dot={myRedemptions.filter((r: any) => r.status === 'approved').length > 0}
        />
      </div>

      {tab === 'shop' ? (
        sorted.length === 0 ? (
          <div className="text-center py-12 font-bold" style={{ color: isTeen ? '#666' : 'var(--ink-50)' }}>
            No rewards yet. Check back soon!
          </div>
        ) : (
          <motion.div
            variants={list} initial="hidden" animate="show"
            className={isTeen ? 'flex flex-col gap-1.5' : 'grid grid-cols-2 gap-3'}
          >
            {sorted.map(reward => (
              <motion.div key={reward.id} variants={item}>
                <RewardCard reward={reward} balance={balance} onClaim={handleClaim} skin={skin} />
              </motion.div>
            ))}
          </motion.div>
        )
      ) : (
        myRedemptions.length === 0 ? (
          <div className="text-center py-12 font-bold" style={{ color: isTeen ? '#666' : 'var(--ink-50)' }}>
            No rewards claimed yet. Hit the shop!
          </div>
        ) : (
          <div className="space-y-2">
            {myRedemptions.map((r: any) => {
              const reward = r.duty_rewards
              const st = STATUS[r.status] || STATUS.pending
              return (
                <div key={r.id} className="flex items-center gap-3" style={{ background: isTeen ? '#1a1a1c' : '#fff', border: isTeen ? '1.5px solid #333' : '2.5px solid var(--ink)', borderRadius: 12, padding: 12, boxShadow: isTeen ? 'none' : 'var(--shadow-sm)', color: isTeen ? '#fff' : 'var(--ink)' }}>
                  <div className="text-2xl">{reward?.emoji || '🎁'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{reward?.name || 'Reward'}</div>
                    <div className="text-xs mt-0.5" style={{ color: isTeen ? '#888' : 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                      {r.points_spent} pts · {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={st.variant}>
                    {r.status === 'fulfilled' && <Check size={10} strokeWidth={3} />}
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

function TabBtn({ active, onClick, icon, label, dot }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; dot?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 relative"
      style={{
        background: active ? 'var(--yellow)' : '#fff',
        color: 'var(--ink)',
        border: '2.5px solid var(--ink)',
        borderRadius: 999,
        padding: '6px 14px',
        fontFamily: 'var(--font-display)',
        fontSize: 13,
        letterSpacing: '-0.02em',
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
        cursor: 'pointer',
      }}
    >
      {icon} {label}
      {dot && <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--ink)' }} />}
    </button>
  )
}

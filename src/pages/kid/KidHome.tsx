import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { useChores } from '../../hooks/useChores'
import { usePoints } from '../../hooks/usePoints'
import { useRewards } from '../../hooks/useRewards'
import { ChoreCard } from '../../components/kid/ChoreCard'
import { RewardCard } from '../../components/kid/RewardCard'
import { CoinsPill } from '../../components/kid/CoinsPill'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Spinner } from '../../components/ui/Spinner'
import { supabase } from '../../lib/supabase'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

export function KidHome() {
  const { profile } = useStore()
  const { chores, loading } = useChores()
  const { balance } = usePoints(profile?.id)
  const { rewards } = useRewards()
  const navigate = useNavigate()

  if (loading || !profile) return <Spinner size="lg" />

  const today = new Date().toISOString().split('T')[0]
  const myChores = chores.filter(c => c.assigned_to === profile.id && (c.due_date === today || !c.due_date))
  const doneCount = myChores.filter(c => c.status === 'approved').length
  const progress = myChores.length > 0 ? (doneCount / myChores.length) * 100 : 0
  const remaining = myChores.length - doneCount

  async function handleComplete(chore: any) {
    if (chore.requires_proof) {
      // TODO: photo upload flow
      return
    }
    await supabase.from('duty_chores').update({
      status: 'submitted',
    }).eq('id', chore.id)
  }

  return (
    <div className="flex-1 px-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between pt-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Hey, <span style={{ color: 'var(--gold)' }}>{profile.full_name.split(' ')[0]}</span>! 💩
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {remaining > 0 ? `${remaining} chore${remaining > 1 ? 's' : ''} left today` : "Everything's done. Suspicious. 💩"}
          </p>
        </div>
        <CoinsPill points={balance} />
      </div>

      {/* Progress */}
      {myChores.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Today's missions: {doneCount}/{myChores.length}
            </span>
          </div>
          <ProgressBar value={progress} color="green" />
        </div>
      )}

      {/* Chore grid */}
      <motion.div variants={list} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 mb-8">
        {myChores.map(chore => (
          <motion.div key={chore.id} variants={item}>
            <ChoreCard chore={chore} onComplete={handleComplete} />
          </motion.div>
        ))}
      </motion.div>

      {/* Reward teaser */}
      {rewards.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Reward Shop</span>
            <button className="text-xs font-medium" style={{ color: 'var(--gold)' }} onClick={() => navigate('/kid/shop')}>
              See all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {rewards.slice(0, 3).map(reward => (
              <div key={reward.id} className="min-w-[160px]">
                <RewardCard reward={reward} balance={balance} onClaim={() => {}} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

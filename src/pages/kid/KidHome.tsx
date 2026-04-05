import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
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

function formatDateLabel(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function KidHome() {
  const { profile, viewAsKid, setViewAsKid } = useStore()
  const activeProfile = viewAsKid || profile
  const isParentPreview = !!viewAsKid
  const { chores, loading } = useChores()
  const { balance } = usePoints(activeProfile?.id)
  const { rewards } = useRewards()
  const navigate = useNavigate()
  const [viewDate, setViewDate] = useState(new Date())

  if (loading || !activeProfile) return <Spinner size="lg" />

  const dateStr = toDateStr(viewDate)
  const today = toDateStr(new Date())
  const isToday = dateStr === today
  const isPast = dateStr < today

  const myChores = chores.filter(c => {
    if (c.assigned_to !== activeProfile.id) return false
    if (c.recurrence === 'daily') return true
    if (c.recurrence === 'weekly') {
      if (!c.recurrence_days?.length) return true
      return c.recurrence_days.includes(viewDate.getDay())
    }
    if (c.recurrence === 'monthly') return true
    return c.due_date === dateStr || (!c.due_date && isToday)
  })

  const doneCount = myChores.filter(c => c.status === 'approved' || c.status === 'submitted').length
  const progress = myChores.length > 0 ? (doneCount / myChores.length) * 100 : 0
  const remaining = myChores.length - doneCount

  async function handleComplete(chore: any) {
    if (chore.requires_proof) return

    const isLate = isPast
    await supabase.from('duty_chores').update({
      status: 'submitted',
      completed_late: isLate || undefined,
      first_completed_at: chore.first_completed_at || new Date().toISOString(),
    }).eq('id', chore.id)
  }

  async function handleUndo(chore: any) {
    await supabase.from('duty_chores').update({
      status: 'pending',
      completed_late: false,
      approved_at: null,
      approved_by: null,
      proof_submitted_at: null,
    }).eq('id', chore.id)
  }

  function exitPreview() {
    setViewAsKid(null)
    navigate('/parent/overview')
  }

  return (
    <div className="flex-1 px-5 pb-8">
      {isParentPreview && (
        <button
          onClick={exitPreview}
          className="flex items-center gap-2 w-full px-4 py-2.5 mt-2 rounded-xl text-xs font-medium"
          style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
        >
          <ArrowLeft size={14} /> Viewing as {activeProfile.full_name} — tap to go back
        </button>
      )}

      <div className="flex items-start justify-between pt-4 mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Hey, <span style={{ color: 'var(--gold)' }}>{activeProfile.full_name.split(' ')[0]}</span>! 💩
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {isToday
              ? remaining > 0 ? `${remaining} chore${remaining > 1 ? 's' : ''} left today` : "Everything's done. Suspicious. 💩"
              : `Viewing ${formatDateLabel(viewDate)}`
            }
          </p>
        </div>
        <CoinsPill points={balance} />
      </div>

      {/* Day navigator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={() => setViewDate(d => new Date(d.getTime() - 86400000))} className="p-2 rounded-full" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: isToday ? 'var(--gold)' : 'rgba(255,255,255,0.7)' }}>
            {formatDateLabel(viewDate)}
          </span>
          {!isToday && (
            <button onClick={() => setViewDate(new Date())} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              Today
            </button>
          )}
        </div>
        <button onClick={() => setViewDate(d => new Date(d.getTime() + 86400000))} className="p-2 rounded-full" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {myChores.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {isToday ? "Today's missions" : 'Missions'}: {doneCount}/{myChores.length}
            </span>
          </div>
          <ProgressBar value={progress} color="green" />
        </div>
      )}

      {myChores.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
          No chores {isToday ? 'today' : 'this day'}. 🎉
        </div>
      ) : (
        <motion.div variants={list} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 mb-8" key={dateStr}>
          {myChores.map(chore => (
            <motion.div key={chore.id} variants={item}>
              <ChoreCard chore={chore} onComplete={handleComplete} onUndo={handleUndo} isPast={isPast} isNew={!chore.first_completed_at} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {isToday && rewards.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Reward Shop</span>
            <button className="text-xs font-medium" style={{ color: 'var(--gold)' }} onClick={() => navigate('/kid/shop')}>See all →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {rewards.slice(0, 3).map((reward: any) => (
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

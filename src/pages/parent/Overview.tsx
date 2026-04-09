import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useChores } from '../../hooks/useChores'
import { useCompletions } from '../../hooks/useCompletions'
import { useChallenges } from '../../hooks/useChallenges'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { toLocalDateStr } from '../../lib/utils'
import { calcChallengeProgress } from '../../lib/challenges'
import { AddChoreSheet } from '../../components/parent/AddChoreSheet'
import { WeeklyChallenge } from '../../components/WeeklyChallenge'
import { StatCard } from '../../components/parent/StatCard'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import confetti from 'canvas-confetti'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

function formatDateLabel(date: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function Overview() {
  const { chores, loading, deleteChore, refresh } = useChores()
  const { getCompletion, approveCompletion, undoCompletion, completions } = useCompletions()
  const { challenge, selectChallenge } = useChallenges()
  const { profile, kids } = useStore()
  const [showAddChore, setShowAddChore] = useState(false)
  const [editChore, setEditChore] = useState<any>(null)
  const [viewDate, setViewDate] = useState(new Date())

  const dateStr = toLocalDateStr(viewDate)
  const todayStr = toLocalDateStr(new Date())
  const isToday = dateStr === todayStr

  // Enrich with selected day's completion
  const enriched = chores.map(c => {
    const comp = getCompletion(c.id, dateStr)
    return { ...c, _completion: comp, _status: comp?.status ?? 'pending' }
  })

  const dayChores = enriched.filter(c => {
    if (c.recurrence === 'daily') return true
    if (c.recurrence === 'weekly') {
      if (!c.recurrence_days?.length) return true
      return c.recurrence_days.includes(viewDate.getDay())
    }
    if (c.recurrence === 'monthly') return true
    return c.due_date === dateStr || (!c.due_date && isToday)
  })

  const doneCount = dayChores.filter(c => c._status === 'approved').length
  const pendingApprovals = dayChores.filter(c => c._status === 'submitted').length

  async function handleApprove(chore: any) {
    const comp = chore._completion
    if (!comp || !profile) return
    await approveCompletion(comp.id, profile.id)

    if (!comp.completed_late) {
      await supabase.from('duty_point_transactions').insert({
        profile_id: comp.completed_by,
        family_id: chore.family_id,
        amount: chore.points,
        reason: `Completed: ${chore.name}`,
        reference_id: comp.id,
        reference_type: 'chore',
        created_by: profile.id,
      })
    }
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  }

  async function handleUndo(chore: any) {
    await undoCompletion(chore.id, dateStr)
  }

  function handleEdit(chore: any) {
    setEditChore(chore)
    setShowAddChore(true)
  }

  async function handleDelete(chore: any) {
    if (!window.confirm(`Delete "${chore.name}"?`)) return
    await deleteChore(chore.id)
  }

  function handleClose() {
    setShowAddChore(false)
    setEditChore(null)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>
            {viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {pendingApprovals > 0 && ` · ${pendingApprovals} pending`}
          </p>
        </div>
        <Button onClick={() => { setEditChore(null); setShowAddChore(true) }}>
          <Plus size={16} /> Add Chore
        </Button>
      </div>

      {/* Day navigator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={() => setViewDate(d => new Date(d.getTime() - 86400000))} className="p-2 rounded-full transition-colors hover:bg-white/[0.06]" style={{ color: 'var(--p-muted)' }}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: isToday ? 'var(--gold)' : 'var(--p-text)' }}>
            {formatDateLabel(viewDate)}
          </span>
          {!isToday && (
            <button onClick={() => setViewDate(new Date())} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              Today
            </button>
          )}
        </div>
        <button onClick={() => setViewDate(d => new Date(d.getTime() + 86400000))} className="p-2 rounded-full transition-colors hover:bg-white/[0.06]" style={{ color: 'var(--p-muted)' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        <StatCard label={isToday ? 'Chores done today' : 'Chores done'} value={`${doneCount}/${dayChores.length}`} />
        <StatCard label="Pending approvals" value={pendingApprovals} />
        <StatCard label="Total chores" value={chores.length} />
      </div>

      {/* Weekly Challenge */}
      <div className="mb-6">
        <WeeklyChallenge
          challenge={challenge}
          progress={challenge ? calcChallengeProgress(challenge, completions, chores, kids.map(k => k.id)) : 0}
          isParent={true}
          onSelect={selectChallenge}
        />
      </div>

      <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--p-dim)' }}>
        {isToday ? "Today's chores" : `Chores for ${formatDateLabel(viewDate)}`}
      </div>

      {dayChores.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          No chores {isToday ? 'yet. Lucky them. 👀' : 'for this day.'}
        </div>
      ) : (
        <motion.div variants={list} initial="hidden" animate="show" className="space-y-1" key={dateStr}>
          {dayChores.map(chore => (
            <motion.div key={chore.id} variants={item}>
              <ChoreRow
                chore={{ ...chore, status: chore._status }}
                onTap={chore._status === 'submitted' ? () => handleApprove(chore) : undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUndo={handleUndo}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      <AddChoreSheet open={showAddChore} onClose={handleClose} onSaved={refresh} editChore={editChore} />
    </div>
  )
}

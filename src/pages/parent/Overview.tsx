import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { StatCard } from '../../components/ui/StatCard'
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
  const { getCompletion, approveCompletion, rejectCompletion, unapproveCompletion, undoCompletion, completions } = useCompletions()
  const { challenge, selectChallenge } = useChallenges()
  const { profile, kids } = useStore()
  const navigate = useNavigate()
  const [showAddChore, setShowAddChore] = useState(false)
  const [editChore, setEditChore] = useState<any>(null)
  const [viewDate, setViewDate] = useState(new Date())

  const dateStr = toLocalDateStr(viewDate)
  const todayStr = toLocalDateStr(new Date())
  const isToday = dateStr === todayStr

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
  const totalPendingAll = completions.filter(c => c.status === 'submitted').length
  const challengeProgress = challenge ? calcChallengeProgress(challenge, completions, chores, kids.map(k => k.id)) : 0

  async function handleApprove(chore: any) {
    const comp = chore._completion
    if (!comp || !profile) return
    await approveCompletion(comp.id, profile.id)
    if (!comp.completed_late) {
      await supabase.from('duty_point_transactions').insert({
        profile_id: comp.completed_by, family_id: chore.family_id,
        amount: chore.points, reason: `Completed: ${chore.name}`,
        reference_id: comp.id, reference_type: 'chore', created_by: profile.id,
      })
    }
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  }
  async function handleReject(chore: any) { if (chore._completion) await rejectCompletion(chore._completion.id) }
  async function handleUnapprove(chore: any) { if (chore._completion) await unapproveCompletion(chore._completion.id) }
  async function handleUndo(chore: any) { await undoCompletion(chore.id, dateStr) }
  function handleEdit(chore: any) { setEditChore(chore); setShowAddChore(true) }
  async function handleDelete(chore: any) {
    if (!window.confirm(`Delete "${chore.name}"?`)) return
    await deleteChore(chore.id)
  }
  function handleClose() { setShowAddChore(false); setEditChore(null) }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-end justify-between mb-5 gap-3">
        <div>
          <div className="stadium-eyebrow">{viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 34,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--ink)',
              marginTop: 4,
            }}
          >
            Today's lineup
          </h1>
        </div>
        <Button onClick={() => { setEditChore(null); setShowAddChore(true) }}>
          <Plus size={16} strokeWidth={3} /> ADD CHORE
        </Button>
      </div>

      {/* Day navigator */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button onClick={() => setViewDate(d => new Date(d.getTime() - 86400000))} style={{ padding: 6, border: '2px solid var(--ink)', borderRadius: 8, background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
          <ChevronLeft size={16} strokeWidth={3} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold" style={{ color: isToday ? 'var(--red)' : 'var(--ink)' }}>{formatDateLabel(viewDate)}</span>
          {!isToday && (
            <button onClick={() => setViewDate(new Date())} className="stadium-eyebrow" style={{ background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 999, padding: '2px 8px' }}>
              TODAY
            </button>
          )}
        </div>
        <button onClick={() => setViewDate(d => new Date(d.getTime() + 86400000))} style={{ padding: 6, border: '2px solid var(--ink)', borderRadius: 8, background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
          <ChevronRight size={16} strokeWidth={3} />
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard tone="green" label="CHORES DONE" value={`${doneCount}/${dayChores.length}`} />
        <StatCard
          tone={totalPendingAll > 0 ? 'yellow' : 'cream'}
          label="NEEDS APPROVAL"
          value={totalPendingAll}
          onClick={totalPendingAll > 0 ? () => navigate('/parent/approvals') : undefined}
        />
        <StatCard tone="blue" label="TOTAL CHORES" value={chores.length} />
        <StatCard tone="pink" label="CHALLENGE" value={challenge ? `${challengeProgress}/${challenge.goal_value}` : '—'} />
      </div>

      {/* Weekly Challenge */}
      <div className="mb-6">
        <WeeklyChallenge
          challenge={challenge}
          progress={challengeProgress}
          isParent={true}
          onSelect={selectChallenge}
        />
      </div>

      <div className="stadium-eyebrow mb-2">
        {isToday ? "TODAY'S CHORES" : `CHORES FOR ${formatDateLabel(viewDate).toUpperCase()}`}
        {pendingApprovals > 0 && ` · ${pendingApprovals} PENDING`}
      </div>

      {dayChores.length === 0 ? (
        <div className="text-center py-12 font-bold" style={{ color: 'var(--ink-50)' }}>
          No chores {isToday ? 'yet. Lucky them. 👀' : 'for this day.'}
        </div>
      ) : (
        <motion.div variants={list} initial="hidden" animate="show" className="space-y-2" key={dateStr}>
          {dayChores.map(chore => (
            <motion.div key={chore.id} variants={item}>
              <ChoreRow
                chore={{ ...chore, status: chore._status }}
                onTap={chore._status === 'submitted' ? () => handleApprove(chore) : undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUndo={handleUndo}
                onReject={handleReject}
                onUnapprove={handleUnapprove}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      <AddChoreSheet open={showAddChore} onClose={handleClose} onSaved={refresh} editChore={editChore} />
    </div>
  )
}

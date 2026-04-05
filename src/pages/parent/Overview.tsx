import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useChores } from '../../hooks/useChores'
import { useCompletions } from '../../hooks/useCompletions'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { AddChoreSheet } from '../../components/parent/AddChoreSheet'
import { StatCard } from '../../components/parent/StatCard'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import confetti from 'canvas-confetti'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

export function Overview() {
  const { chores, loading } = useChores()
  const { getCompletion, approveCompletion, undoCompletion } = useCompletions()
  const { profile } = useStore()
  const [showAddChore, setShowAddChore] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  // Enrich with today's completion
  const enriched = chores.map(c => {
    const comp = getCompletion(c.id, today)
    return { ...c, _completion: comp, _status: comp?.status ?? 'pending' }
  })

  const todayChores = enriched.filter(c => {
    if (c.recurrence === 'daily') return true
    if (c.recurrence === 'weekly') return true
    if (c.recurrence === 'monthly') return true
    return c.due_date === today || !c.due_date
  })

  const doneToday = todayChores.filter(c => c._status === 'approved').length
  const pendingApprovals = todayChores.filter(c => c._status === 'submitted').length

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
        reference_id: chore.id,
        reference_type: 'chore',
        created_by: profile.id,
      })
    }
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
  }

  async function handleUndo(chore: any) {
    await undoCompletion(chore.id, today)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {pendingApprovals > 0 && ` · ${pendingApprovals} pending`}
          </p>
        </div>
        <Button onClick={() => setShowAddChore(true)}>
          <Plus size={16} /> Add Chore
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        <StatCard label="Chores done today" value={`${doneToday}/${todayChores.length}`} />
        <StatCard label="Pending approvals" value={pendingApprovals} />
        <StatCard label="Total chores" value={chores.length} />
      </div>

      <div className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--p-dim)' }}>
        Today's chores
      </div>

      {todayChores.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          No chores yet. Lucky them. 👀
        </div>
      ) : (
        <motion.div variants={list} initial="hidden" animate="show" className="space-y-1">
          {todayChores.map(chore => (
            <motion.div key={chore.id} variants={item}>
              <ChoreRow
                chore={{ ...chore, status: chore._status }}
                onTap={chore._status === 'submitted' ? () => handleApprove(chore) : undefined}
                onUndo={handleUndo}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
      <AddChoreSheet open={showAddChore} onClose={() => setShowAddChore(false)} onSaved={() => {}} />
    </div>
  )
}

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useChores } from '../../hooks/useChores'
import { useCompletions } from '../../hooks/useCompletions'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { toLocalDateStr } from '../../lib/utils'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { AddChoreSheet } from '../../components/parent/AddChoreSheet'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import confetti from 'canvas-confetti'

export function Chores() {
  const { chores, loading, deleteChore, refresh } = useChores()
  const { getCompletion, approveCompletion, rejectCompletion, unapproveCompletion, undoCompletion } = useCompletions()
  const { profile } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editChore, setEditChore] = useState<any>(null)

  const today = toLocalDateStr(new Date())

  // Enrich chores with today's completion status
  const enrichedChores = chores.map(c => {
    const comp = getCompletion(c.id, today)
    return { ...c, _completion: comp, _status: comp?.status ?? 'pending' }
  })

  function handleEdit(chore: any) {
    setEditChore(chore)
    setShowForm(true)
  }

  async function handleDelete(chore: any) {
    if (!window.confirm(`Delete "${chore.name}"?`)) return
    await deleteChore(chore.id)
  }

  async function handleApprove(chore: any) {
    const comp = chore._completion
    if (!comp || !profile) return

    await approveCompletion(comp.id, profile.id)

    // Award points (only if not late)
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

  async function handleReject(chore: any) {
    const comp = chore._completion
    if (!comp) return
    await rejectCompletion(comp.id)
  }

  async function handleUnapprove(chore: any) {
    const comp = chore._completion
    if (!comp) return
    await unapproveCompletion(comp.id)
  }

  async function handleUndo(chore: any) {
    await undoCompletion(chore.id, today)
  }

  function handleClose() {
    setShowForm(false)
    setEditChore(null)
  }

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Chores</h1>
        <Button onClick={() => { setEditChore(null); setShowForm(true) }}>
          <Plus size={16} /> Add Chore
        </Button>
      </div>

      {enrichedChores.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          No chores yet. Lucky them. 👀
        </div>
      ) : (
        <div className="space-y-1">
          {enrichedChores.map(chore => (
            <ChoreRow
              key={chore.id}
              chore={{ ...chore, status: chore._status }}
              onTap={chore._status === 'submitted' ? () => handleApprove(chore) : undefined}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUndo={handleUndo}
              onReject={handleReject}
              onUnapprove={handleUnapprove}
            />
          ))}
        </div>
      )}

      <AddChoreSheet open={showForm} onClose={handleClose} onSaved={refresh} editChore={editChore} />
    </div>
  )
}

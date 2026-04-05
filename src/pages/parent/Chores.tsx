import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useChores } from '../../hooks/useChores'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { approveChore } from '../../lib/approveChore'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { AddChoreSheet } from '../../components/parent/AddChoreSheet'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function Chores() {
  const { chores, loading, deleteChore, refresh } = useChores()
  const { profile } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editChore, setEditChore] = useState<any>(null)

  function handleEdit(chore: any) {
    setEditChore(chore)
    setShowForm(true)
  }

  async function handleDelete(chore: any) {
    if (!window.confirm(`Delete "${chore.name}"?`)) return
    await deleteChore(chore.id)
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

      {chores.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          No chores yet. Lucky them. 👀
        </div>
      ) : (
        <div className="space-y-1">
          {chores.map(chore => (
            <ChoreRow
              key={chore.id}
              chore={chore}
              onTap={chore.status === 'submitted' && profile ? () => approveChore(chore, profile.id) : undefined}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUndo={handleUndo}
            />
          ))}
        </div>
      )}

      <AddChoreSheet open={showForm} onClose={handleClose} onSaved={refresh} editChore={editChore} />
    </div>
  )
}

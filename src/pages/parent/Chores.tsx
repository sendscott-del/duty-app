import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useChores } from '../../hooks/useChores'
import { useStore } from '../../lib/store'
import { approveChore } from '../../lib/approveChore'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { AddChoreSheet } from '../../components/parent/AddChoreSheet'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function Chores() {
  const { chores, loading } = useChores()
  const { profile } = useStore()
  const [showAdd, setShowAdd] = useState(false)

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Chores</h1>
        <Button onClick={() => setShowAdd(true)}>
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
            <ChoreRow key={chore.id} chore={chore} onTap={chore.status === 'submitted' && profile ? () => approveChore(chore, profile.id) : undefined} />
          ))}
        </div>
      )}

      <AddChoreSheet open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => {}} />
    </div>
  )
}

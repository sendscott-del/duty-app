import { useChores } from '../../hooks/useChores'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { Spinner } from '../../components/ui/Spinner'

export function Chores() {
  const { chores, loading } = useChores()

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <h1 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--p-text)' }}>Chores</h1>

      {chores.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--p-muted)' }}>
          No chores yet. Lucky them. 👀
        </div>
      ) : (
        <div className="space-y-1">
          {chores.map(chore => (
            <ChoreRow key={chore.id} chore={chore} />
          ))}
        </div>
      )}
    </div>
  )
}

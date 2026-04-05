
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useChores } from '../../hooks/useChores'

import { StatCard } from '../../components/parent/StatCard'
import { ChoreRow } from '../../components/parent/ChoreRow'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

export function Overview() {
  const { chores, loading } = useChores()
  const today = new Date().toISOString().split('T')[0]

  const todayChores = chores.filter(c => c.due_date === today || !c.due_date)
  const doneToday = todayChores.filter(c => c.status === 'approved').length
  const pendingApprovals = chores.filter(c => c.status === 'submitted').length

  if (loading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--p-text)' }}>Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {pendingApprovals > 0 && ` · ${pendingApprovals} pending`}
          </p>
        </div>
        <Button>
          <Plus size={16} /> Add Chore
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        <StatCard label="Chores done today" value={`${doneToday}/${todayChores.length}`} />
        <StatCard label="Pending approvals" value={pendingApprovals} />
        <StatCard label="Total chores" value={chores.length} />
      </div>

      {/* Today's chores */}
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
              <ChoreRow chore={chore} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

import { motion } from 'framer-motion'
import { Check, X, Clock } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'

const STATUS_CIRCLE: Record<string, React.ReactNode> = {
  pending: <div className="w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--p-dim)' }} />,
  submitted: (
    <div className="w-5 h-5 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'var(--amber-dim)', border: '1.5px solid var(--amber)' }}>
      <Clock size={10} style={{ color: 'var(--amber)' }} />
    </div>
  ),
  approved: (
    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--green)', color: '#000' }}>
      <Check size={12} strokeWidth={3} />
    </div>
  ),
  rejected: (
    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--red)' }}>
      <X size={12} strokeWidth={3} />
    </div>
  ),
}

interface ChoreRowProps {
  chore: any
  onTap?: () => void
}

export function ChoreRow({ chore, onTap }: ChoreRowProps) {
  const isDone = chore.status === 'approved'
  const needsApproval = chore.status === 'submitted'
  const kid = chore.profiles

  return (
    <motion.button
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors min-h-[52px] hover:bg-white/[0.03]"
      onClick={onTap}
      whileTap={{ scale: 0.99 }}
    >
      {STATUS_CIRCLE[chore.status]}

      <div className="flex-1 min-w-0">
        <div className={`text-sm ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--p-dim)' : 'var(--p-text)' }}>
          {chore.emoji} {chore.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {kid && <Avatar name={kid.full_name} color={kid.avatar_color} size="sm" />}
          <span className="text-xs" style={{ color: 'var(--p-muted)' }}>{kid?.full_name}</span>
        </div>
      </div>

      {needsApproval ? (
        <Badge variant="amber">Needs approval</Badge>
      ) : (
        <Badge variant={isDone ? 'green' : 'gold'}>+{chore.points} pts</Badge>
      )}
    </motion.button>
  )
}

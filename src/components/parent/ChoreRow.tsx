import { motion } from 'framer-motion'
import { Check, X, Clock, Trash2, Pencil, Repeat, Undo2 } from 'lucide-react'
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

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface ChoreRowProps {
  chore: any
  onTap?: () => void
  onEdit?: (chore: any) => void
  onDelete?: (chore: any) => void
  onUndo?: (chore: any) => void
}

export function ChoreRow({ chore, onTap, onEdit, onDelete, onUndo }: ChoreRowProps) {
  const isDone = chore.status === 'approved'
  const needsApproval = chore.status === 'submitted'
  const kid = chore.duty_profiles

  const recurrenceLabel = RECURRENCE_LABELS[chore.recurrence]
  const daysList = chore.recurrence === 'weekly' && chore.recurrence_days?.length
    ? chore.recurrence_days.map((d: number) => DAY_ABBR[d]).join(', ')
    : null

  return (
    <div className="flex items-center gap-1 group">
      <motion.button
        className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors min-h-[52px] hover:bg-white/[0.03]"
        onClick={onTap}
        whileTap={{ scale: 0.99 }}
      >
        {STATUS_CIRCLE[chore.status]}

        <div className="flex-1 min-w-0">
          <div className={`text-sm ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--p-dim)' : 'var(--p-text)' }}>
            {chore.emoji} {chore.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {kid && <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />}
            <span className="text-xs" style={{ color: 'var(--p-muted)' }}>{kid?.full_name}</span>
            {recurrenceLabel && (
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--p-dim)' }}>
                <Repeat size={9} /> {recurrenceLabel}{daysList ? ` (${daysList})` : ''}
              </span>
            )}
          </div>
        </div>

        {needsApproval ? (
          <Badge variant="amber">Needs approval</Badge>
        ) : (
          <Badge variant={isDone ? 'green' : 'gold'}>+{chore.points} pts</Badge>
        )}
      </motion.button>

      {/* Actions — visible on hover */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onUndo && (isDone || needsApproval) && (
          <button
            onClick={(e) => { e.stopPropagation(); onUndo(chore) }}
            className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: 'var(--amber)' }}
            title="Undo completion"
          >
            <Undo2 size={13} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(chore) }}
            className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: 'var(--p-muted)' }}
            title="Edit chore"
          >
            <Pencil size={13} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(chore) }}
            className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
            style={{ color: 'var(--red)' }}
            title="Delete chore"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

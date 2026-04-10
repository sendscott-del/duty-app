import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Clock, Trash2, Pencil, Repeat, Undo2, ThumbsDown, CheckCircle } from 'lucide-react'
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
  onReject?: (chore: any) => void
  onUnapprove?: (chore: any) => void
}

interface ActionItem {
  label: string
  icon: React.ReactNode
  color: string
  action: () => void
}

export function ChoreRow({ chore, onTap, onEdit, onDelete, onUndo, onReject, onUnapprove }: ChoreRowProps) {
  const [showActions, setShowActions] = useState(false)
  const isDone = chore.status === 'approved'
  const needsApproval = chore.status === 'submitted'
  const isRejected = chore.status === 'rejected'
  const kid = chore.duty_profiles

  const recurrenceLabel = RECURRENCE_LABELS[chore.recurrence]
  const daysList = chore.recurrence === 'weekly' && chore.recurrence_days?.length
    ? chore.recurrence_days.map((d: number) => DAY_ABBR[d]).join(', ')
    : null

  // Build action list for the mobile sheet
  const actions: ActionItem[] = []
  if (onTap && needsApproval) {
    actions.push({ label: 'Approve', icon: <CheckCircle size={16} />, color: 'var(--green)', action: () => { onTap(); setShowActions(false) } })
  }
  if (onReject && needsApproval) {
    actions.push({ label: 'Reject', icon: <ThumbsDown size={16} />, color: 'var(--red)', action: () => { onReject(chore); setShowActions(false) } })
  }
  if (onUnapprove && isDone) {
    actions.push({ label: 'Undo Approval', icon: <Undo2 size={16} />, color: 'var(--amber)', action: () => { onUnapprove(chore); setShowActions(false) } })
  }
  if (onUndo && (needsApproval || isRejected)) {
    actions.push({ label: 'Clear Completion', icon: <X size={16} />, color: 'var(--p-muted)', action: () => { onUndo(chore); setShowActions(false) } })
  }
  if (onEdit) {
    actions.push({ label: 'Edit Chore', icon: <Pencil size={16} />, color: 'var(--p-muted)', action: () => { onEdit(chore); setShowActions(false) } })
  }
  if (onDelete) {
    actions.push({ label: 'Delete Chore', icon: <Trash2 size={16} />, color: 'var(--red)', action: () => { onDelete(chore); setShowActions(false) } })
  }

  function handleRowTap() {
    // Desktop: use onTap directly (approve submitted chores)
    // Mobile: always open action sheet if there are actions
    if (window.innerWidth >= 1024) {
      onTap?.()
    } else {
      if (actions.length > 0) setShowActions(true)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 group">
        <motion.button
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors min-h-[52px] hover:bg-white/[0.03]"
          onClick={handleRowTap}
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
          ) : isRejected ? (
            <Badge variant="red">Rejected</Badge>
          ) : (
            <Badge variant={isDone ? 'green' : 'gold'}>+{chore.points} pts</Badge>
          )}
        </motion.button>

        {/* Desktop: actions visible on hover */}
        <div className="hidden lg:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onReject && needsApproval && (
            <button
              onClick={(e) => { e.stopPropagation(); onReject(chore) }}
              className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--red)' }}
              title="Reject — send back to kid"
            >
              <ThumbsDown size={13} />
            </button>
          )}
          {onUnapprove && isDone && (
            <button
              onClick={(e) => { e.stopPropagation(); onUnapprove(chore) }}
              className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--amber)' }}
              title="Undo approval — reverts points"
            >
              <Undo2 size={13} />
            </button>
          )}
          {onUndo && (needsApproval || isRejected) && (
            <button
              onClick={(e) => { e.stopPropagation(); onUndo(chore) }}
              className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--p-muted)' }}
              title="Clear completion entirely"
            >
              <X size={13} />
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

      {/* Mobile: action sheet */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="rounded-t-2xl border-t" style={{ background: 'var(--p-surface)', borderColor: 'var(--p-border)' }}>
                {/* Header */}
                <div className="px-5 pt-4 pb-2">
                  <div className="text-sm font-medium" style={{ color: 'var(--p-text)' }}>{chore.emoji} {chore.name}</div>
                  <div className="text-xs" style={{ color: 'var(--p-muted)' }}>{kid?.full_name}</div>
                </div>

                {/* Action buttons */}
                <div className="px-3 pb-3 space-y-0.5">
                  {actions.map((a) => (
                    <button
                      key={a.label}
                      onClick={a.action}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors active:bg-white/[0.06]"
                    >
                      <span style={{ color: a.color }}>{a.icon}</span>
                      <span className="text-sm" style={{ color: a.color }}>{a.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cancel */}
                <div className="px-3 pb-5">
                  <button
                    onClick={() => setShowActions(false)}
                    className="w-full py-3 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--p-card)', color: 'var(--p-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

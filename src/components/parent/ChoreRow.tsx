import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Clock, Trash2, Pencil, Repeat, Undo2, ThumbsDown, CheckCircle, MoreVertical } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'

const STATUS_CIRCLE: Record<string, React.ReactNode> = {
  pending: <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid var(--ink)', background: '#fff', flexShrink: 0 }} />,
  submitted: (
    <div className="animate-pulse" style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--yellow)', border: '2.5px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Clock size={11} strokeWidth={3} style={{ color: 'var(--ink)' }} />
    </div>
  ),
  approved: (
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green)', border: '2.5px solid var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Check size={13} strokeWidth={3.5} />
    </div>
  ),
  rejected: (
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--red)', border: '2.5px solid var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <X size={13} strokeWidth={3.5} />
    </div>
  ),
}

const RECURRENCE_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
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

interface ActionItem { label: string; icon: React.ReactNode; color: string; action: () => void }

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

  const actions: ActionItem[] = []
  if (onTap && needsApproval) actions.push({ label: 'Approve', icon: <CheckCircle size={16} />, color: 'var(--green)', action: () => { onTap(); setShowActions(false) } })
  if (onReject && needsApproval) actions.push({ label: 'Reject', icon: <ThumbsDown size={16} />, color: 'var(--red)', action: () => { onReject(chore); setShowActions(false) } })
  if (onUnapprove && isDone) actions.push({ label: 'Undo Approval', icon: <Undo2 size={16} />, color: 'var(--ink)', action: () => { onUnapprove(chore); setShowActions(false) } })
  if (onUndo && (needsApproval || isRejected)) actions.push({ label: 'Clear Completion', icon: <X size={16} />, color: 'var(--ink-50)', action: () => { onUndo(chore); setShowActions(false) } })
  if (onEdit) actions.push({ label: 'Edit Chore', icon: <Pencil size={16} />, color: 'var(--ink)', action: () => { onEdit(chore); setShowActions(false) } })
  if (onDelete) actions.push({ label: 'Delete Chore', icon: <Trash2 size={16} />, color: 'var(--red)', action: () => { onDelete(chore); setShowActions(false) } })

  return (
    <>
      <div className="flex items-center gap-1 group">
        <motion.button
          className="flex-1 flex items-center gap-3 text-left min-h-[56px]"
          onClick={onTap}
          whileTap={{ scale: 0.99 }}
          style={{
            background: '#fff',
            border: '2.5px solid var(--ink)',
            borderRadius: 12,
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--ink)',
            opacity: isDone ? 0.6 : 1,
          }}
        >
          {STATUS_CIRCLE[chore.status]}

          <div className="flex-1 min-w-0">
            <div style={{ fontWeight: 700, fontSize: 14, textDecoration: isDone ? 'line-through' : 'none' }}>
              <span style={{ marginRight: 6 }}>{chore.emoji}</span>{chore.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {kid && <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />}
              <span className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>{kid?.full_name}</span>
              {recurrenceLabel && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
                  <Repeat size={9} /> {recurrenceLabel}{daysList ? ` (${daysList})` : ''}
                </span>
              )}
            </div>
          </div>

          {needsApproval ? <Badge variant="amber">Needs approval</Badge>
            : isRejected ? <Badge variant="red">Rejected</Badge>
            : <Badge variant={isDone ? 'green' : 'gold'}>+{chore.points}</Badge>}
        </motion.button>

        {actions.length > 0 && (
          <button
            onClick={() => setShowActions(true)}
            style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 10, padding: 8, color: 'var(--ink)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', flexShrink: 0 }}
          >
            <MoreVertical size={16} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Action sheet */}
      <AnimatePresence>
        {showActions && (
          <>
            <motion.div className="fixed inset-0 z-40" style={{ background: 'rgba(26,20,17,0.5)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowActions(false)} />
            <motion.div
              className="fixed z-50 inset-x-0 bottom-0 lg:inset-0 lg:flex lg:items-center lg:justify-center"
              initial={{ y: '100%', opacity: 0.8 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div
                className="w-full lg:max-w-sm"
                style={{
                  background: 'var(--cream)',
                  border: '3px solid var(--ink)',
                  borderTopLeftRadius: 24, borderTopRightRadius: 24,
                  borderBottom: 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 pt-4 pb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
                  <div className="font-bold" style={{ color: 'var(--ink)' }}>{chore.emoji} {chore.name}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>{kid?.full_name}</div>
                </div>
                <div className="px-3 pt-3 pb-4 space-y-1">
                  {actions.map(a => (
                    <button
                      key={a.label}
                      onClick={a.action}
                      className="w-full flex items-center gap-3 text-left"
                      style={{
                        background: '#fff',
                        border: '2.5px solid var(--ink)',
                        borderRadius: 10,
                        padding: '10px 14px',
                        boxShadow: 'var(--shadow-sm)',
                        color: a.color,
                        fontWeight: 700,
                      }}
                    >
                      {a.icon}
                      <span>{a.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowActions(false)}
                    className="w-full mt-2"
                    style={{ background: 'transparent', border: '2.5px solid var(--ink)', borderRadius: 10, padding: 10, fontWeight: 800, color: 'var(--ink)' }}
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

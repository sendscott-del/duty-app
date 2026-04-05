import { motion } from 'framer-motion'
import { Check, Clock, Camera, Sparkles } from 'lucide-react'

interface ChoreCardProps {
  chore: any
  onComplete: (chore: any) => void
  isPast?: boolean
  isNew?: boolean
}

export function ChoreCard({ chore, onComplete, isPast, isNew }: ChoreCardProps) {
  const isDone = chore.status === 'approved'
  const isSubmitted = chore.status === 'submitted'
  const isRejected = chore.status === 'rejected'
  const isLate = chore.completed_late

  const cardBg = isDone
    ? 'rgba(74,222,128,0.08)'
    : isSubmitted
    ? 'rgba(251,191,36,0.08)'
    : isRejected
    ? 'rgba(248,113,113,0.06)'
    : 'rgba(255,255,255,0.06)'

  const cardBorder = isDone
    ? 'rgba(74,222,128,0.2)'
    : isSubmitted
    ? 'rgba(251,191,36,0.2)'
    : isNew
    ? 'rgba(245,200,66,0.3)'
    : 'rgba(255,255,255,0.1)'

  const canComplete = !isDone && !isSubmitted

  return (
    <motion.button
      className="w-full rounded-2xl p-4 text-left relative overflow-hidden min-h-[120px] flex flex-col justify-between"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
      whileTap={canComplete ? { scale: [1, 1.08, 0.97, 1] } : undefined}
      transition={{ duration: 0.35 }}
      onClick={() => canComplete && onComplete(chore)}
      disabled={!canComplete}
    >
      {/* NEW badge */}
      {isNew && !isDone && !isSubmitted && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>
          <Sparkles size={8} /> NEW
        </div>
      )}

      <div>
        <div className="text-2xl mb-2">{chore.emoji}</div>
        <div className={`text-sm font-medium ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--p-dim)' : 'rgba(255,255,255,0.9)' }}>
          {chore.name}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>
          +{chore.points} pts
        </span>

        {isDone && (
          <div className="flex items-center gap-1">
            {isLate && <span className="text-[9px] font-medium" style={{ color: 'var(--amber)' }}>LATE</span>}
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isLate ? 'var(--amber)' : 'var(--green)' }}>
              <Check size={14} color="#000" strokeWidth={3} />
            </div>
          </div>
        )}
        {isSubmitted && (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--amber)' }}>
            <Clock size={12} /> Waiting...
          </div>
        )}
        {isRejected && (
          <span className="text-[11px]" style={{ color: 'var(--red)' }}>Try again</span>
        )}
        {canComplete && isPast && (
          <span className="text-[10px] font-medium" style={{ color: 'var(--amber)' }}>Late</span>
        )}
        {chore.requires_proof && chore.status === 'pending' && !isPast && (
          <Camera size={14} style={{ color: 'var(--p-dim)' }} />
        )}
      </div>
    </motion.button>
  )
}

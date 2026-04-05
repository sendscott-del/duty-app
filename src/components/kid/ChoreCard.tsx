import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Camera, Sparkles, Undo2 } from 'lucide-react'

interface ChoreCardProps {
  chore: any
  onComplete: (chore: any) => void
  onUndo?: (chore: any) => void
  isPast?: boolean
  isNew?: boolean
}

export function ChoreCard({ chore, onComplete, onUndo, isPast, isNew }: ChoreCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const isDone = chore.status === 'approved'
  const isSubmitted = chore.status === 'submitted'
  const isRejected = chore.status === 'rejected'
  const isLate = chore.completed_late
  const canComplete = !isDone && !isSubmitted && !confirming
  const canUndo = (isDone || isSubmitted) && onUndo

  const cardBg = justCompleted
    ? 'rgba(74,222,128,0.15)'
    : confirming
    ? 'rgba(245,200,66,0.12)'
    : isDone
    ? 'rgba(74,222,128,0.08)'
    : isSubmitted
    ? 'rgba(251,191,36,0.08)'
    : isRejected
    ? 'rgba(248,113,113,0.06)'
    : 'rgba(255,255,255,0.06)'

  const cardBorder = confirming
    ? 'rgba(245,200,66,0.4)'
    : isDone
    ? 'rgba(74,222,128,0.2)'
    : isSubmitted
    ? 'rgba(251,191,36,0.2)'
    : isNew
    ? 'rgba(245,200,66,0.3)'
    : 'rgba(255,255,255,0.1)'

  function handleTap() {
    if (confirming) {
      setConfirming(false)
      setJustCompleted(true)
      onComplete(chore)
      setTimeout(() => setJustCompleted(false), 2000)
    } else if (canComplete) {
      setConfirming(true)
    }
  }

  return (
    <motion.div
      className="w-full rounded-2xl p-4 text-left relative overflow-hidden min-h-[120px] flex flex-col justify-between cursor-pointer select-none"
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, transition: 'background 0.2s, border-color 0.2s' }}
      whileTap={canComplete || confirming ? { scale: [1, 1.06, 0.98, 1] } : undefined}
      transition={{ duration: 0.3 }}
      onClick={handleTap}
    >
      {/* NEW badge */}
      {isNew && !isDone && !isSubmitted && !confirming && (
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

      {/* Confirmation prompt */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-center"
          >
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--gold)' }}>
              {isPast ? 'Mark as done late?' : 'Mark as done?'}
            </div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Tap again to confirm</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Just completed flash */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
            style={{ background: 'rgba(74,222,128,0.15)' }}
          >
            <div className="text-center">
              <Check size={32} style={{ color: 'var(--green)' }} strokeWidth={3} />
              <div className="text-xs font-semibold mt-1" style={{ color: 'var(--green)' }}>Done! 💩</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal footer */}
      {!confirming && !justCompleted && (
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
      )}

      {/* Undo button */}
      {canUndo && !confirming && !justCompleted && (
        <button
          onClick={(e) => { e.stopPropagation(); onUndo!(chore) }}
          className="absolute top-2 right-2 p-1.5 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)' }}
          title="Undo"
        >
          <Undo2 size={12} />
        </button>
      )}
    </motion.div>
  )
}

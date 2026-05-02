import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Camera, Sparkles, Undo2 } from 'lucide-react'
import type { KidSkin } from '../../hooks/useKidSkin'

interface ChoreCardProps {
  chore: any
  onComplete: (chore: any) => void
  onUndo?: (chore: any) => void
  isPast?: boolean
  isNew?: boolean
  skin?: KidSkin
}

/**
 * Stadium ChoreCard.
 * - Younger skin: chunky bordered tile with big emoji + colored bg, "Flush it!" energy.
 * - Teen skin: dark slim row with stat pills.
 */
export function ChoreCard({ chore, onComplete, onUndo, isPast, isNew, skin = 'younger' }: ChoreCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const isDone = chore.status === 'approved'
  const isSubmitted = chore.status === 'submitted'
  const isRejected = chore.status === 'rejected'
  const isLate = chore.completed_late
  const canComplete = !isDone && !isSubmitted && !confirming
  const canUndo = (isDone || isSubmitted) && onUndo

  function handleTap() {
    if (confirming) {
      setConfirming(false)
      setJustCompleted(true)
      onComplete(chore)
      setTimeout(() => setJustCompleted(false), 1600)
    } else if (canComplete) {
      setConfirming(true)
      setTimeout(() => setConfirming(c => c), 0)
    }
  }

  if (skin === 'teen') {
    return (
      <motion.div
        whileTap={canComplete || confirming ? { scale: 0.98 } : undefined}
        onClick={handleTap}
        style={{
          background: isDone ? 'transparent' : '#1a1a1c',
          border: `1.5px solid ${isDone ? '#222' : confirming ? 'var(--yellow)' : '#333'}`,
          borderRadius: 10,
          padding: '12px 14px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          opacity: isDone ? 0.45 : 1,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 22, height: 22, borderRadius: 6,
            background: isDone ? 'var(--yellow)' : 'transparent',
            border: `2px solid ${isDone ? 'var(--yellow)' : '#555'}`,
            color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, flexShrink: 0,
          }}
        >
          {isDone ? '✓' : ''}
        </div>
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              textDecoration: isDone ? 'line-through' : 'none',
            }}
          >
            <span style={{ marginRight: 6 }}>{chore.emoji}</span>
            {chore.name}
          </div>
          {confirming && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--yellow)', marginTop: 2 }}>
              Tap again to confirm
            </div>
          )}
          {isSubmitted && !confirming && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--yellow)', marginTop: 2 }}>
              Waiting for approval…
            </div>
          )}
          {isRejected && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--red)', marginTop: 2 }}>
              Try again
            </div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: isDone ? '#555' : 'var(--yellow)', flexShrink: 0 }}>
          +{chore.points}
        </div>
        {canUndo && !confirming && !justCompleted && (
          <button
            onClick={(e) => { e.stopPropagation(); onUndo!(chore) }}
            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
            title="Undo"
          >
            <Undo2 size={12} />
          </button>
        )}
      </motion.div>
    )
  }

  // YOUNGER skin
  const tileColors = ['var(--red)', 'var(--blue)', 'var(--green)', 'var(--pink)']
  const baseColor = tileColors[Math.abs(hashCode(chore.id || chore.name || '')) % tileColors.length]

  return (
    <motion.div
      whileTap={canComplete || confirming ? { scale: [1, 1.04, 0.98, 1] } : undefined}
      transition={{ duration: 0.3 }}
      onClick={handleTap}
      className="relative cursor-pointer select-none"
      style={{
        background: isDone ? '#fff' : confirming ? 'var(--yellow)' : baseColor,
        color: isDone ? '#999' : confirming ? 'var(--ink)' : '#fff',
        border: '3px solid var(--ink)',
        borderRadius: 18,
        padding: 14,
        boxShadow: isDone ? 'var(--shadow-sm)' : 'var(--shadow)',
        opacity: isDone ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        aspectRatio: '1 / 1',
        textAlign: 'center',
        minHeight: 0,
      }}
    >
      {isNew && !isDone && !isSubmitted && !confirming && (
        <div
          className="absolute"
          style={{
            top: 6, right: 6,
            background: 'var(--yellow)', color: 'var(--ink)',
            border: '2px solid var(--ink)',
            borderRadius: 999,
            padding: '1px 6px',
            fontSize: 9, fontWeight: 800, letterSpacing: 1,
            display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          <Sparkles size={9} /> NEW
        </div>
      )}

      <div style={{ fontSize: 40, lineHeight: 1, filter: isDone ? 'grayscale(1)' : 'none' }}>
        {chore.emoji}
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          textDecoration: isDone ? 'line-through' : 'none',
        }}
      >
        {chore.name}
      </div>

      {confirming ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink)', fontWeight: 700, marginTop: 'auto' }}>
          TAP AGAIN!
        </div>
      ) : (
        <div
          style={{
            background: isDone ? '#eee' : 'var(--yellow)',
            color: 'var(--ink)',
            border: '2px solid var(--ink)',
            borderRadius: 8,
            padding: '2px 8px',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            marginTop: 'auto',
          }}
        >
          +{chore.points}
        </div>
      )}

      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: 'var(--green)',
              border: '3px solid var(--ink)',
              borderRadius: 18,
              color: '#fff',
            }}
          >
            <Check size={48} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status corner badges */}
      {!confirming && !justCompleted && (
        <>
          {isDone && (
            <div className="absolute" style={{ top: 6, left: 6 }}>
              <div
                style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: isLate ? 'var(--yellow)' : 'var(--green)',
                  color: '#fff',
                  border: '2px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Check size={14} strokeWidth={3} />
              </div>
            </div>
          )}
          {isSubmitted && (
            <div className="absolute" style={{ top: 6, left: 6, display: 'flex', alignItems: 'center', gap: 3, background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 8, padding: '2px 6px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              <Clock size={9} /> WAIT
            </div>
          )}
          {isRejected && (
            <div className="absolute" style={{ top: 6, left: 6, background: 'var(--red)', color: '#fff', border: '2px solid var(--ink)', borderRadius: 8, padding: '2px 6px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              REDO
            </div>
          )}
          {chore.requires_proof && chore.status === 'pending' && !isPast && (
            <div className="absolute" style={{ bottom: 6, right: 6, color: '#fff', opacity: 0.85 }}>
              <Camera size={12} />
            </div>
          )}
        </>
      )}

      {canUndo && !confirming && !justCompleted && (
        <button
          onClick={(e) => { e.stopPropagation(); onUndo!(chore) }}
          style={{
            position: 'absolute', top: 6, right: 6,
            background: '#fff', border: '2px solid var(--ink)',
            borderRadius: 8, padding: 4,
            color: 'var(--ink)', cursor: 'pointer',
          }}
          title="Undo"
        >
          <Undo2 size={11} strokeWidth={3} />
        </button>
      )}
    </motion.div>
  )
}

function hashCode(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0
  return h
}

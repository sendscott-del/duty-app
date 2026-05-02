import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SirFlush } from '../ui/SirFlush'
import { Confetti } from '../ui/Confetti'
import type { KidSkin } from '../../hooks/useKidSkin'

interface CelebrateProps {
  open: boolean
  onClose: () => void
  points: number
  streak?: number
  combo?: number
  skin?: KidSkin
}

export function Celebrate({ open, onClose, points, streak, combo, skin = 'younger' }: CelebrateProps) {
  // Auto-dismiss after 2.4s
  useEffect(() => {
    if (!open) return
    const t = setTimeout(onClose, 2600)
    return () => clearTimeout(t)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: skin === 'teen' ? 'rgba(15,15,16,0.92)' : 'var(--yellow)',
          }}
        >
          {skin === 'younger' && <Confetti count={28} active={open} />}

          <motion.div
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 16 }}
            className="relative flex flex-col items-center gap-4 text-center"
            style={{ padding: 24 }}
          >
            <div style={{ filter: skin === 'younger' ? 'drop-shadow(var(--shadow))' : 'none', opacity: skin === 'teen' ? 0.85 : 1 }}>
              <SirFlush size={skin === 'younger' ? 160 : 90} expression="cheer" />
            </div>

            {skin === 'younger' ? (
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 64,
                  color: 'var(--red)',
                  letterSpacing: '-0.04em',
                  lineHeight: 0.9,
                  textShadow: '5px 5px 0 var(--ink)',
                }}
              >
                YESSS!
              </div>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 48,
                  color: 'var(--yellow)',
                  letterSpacing: '-0.03em',
                }}
              >
                +{points}
              </div>
            )}

            {skin === 'younger' ? (
              <div
                style={{
                  background: '#fff',
                  border: '4px solid var(--ink)',
                  borderRadius: 18,
                  padding: '10px 18px',
                  boxShadow: 'var(--shadow-lg)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                +{points} ★
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#888' }}>
                CHORE LOGGED
                {streak ? ` · ${streak}D STREAK` : ''}
                {combo ? ` · ×${combo} COMBO` : ''}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

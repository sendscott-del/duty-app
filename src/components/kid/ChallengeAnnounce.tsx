import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Challenge } from '../../lib/challenges'
import { SirFlush } from '../ui/SirFlush'

const SEEN_KEY = 'duty-challenge-seen'

/** Has this kid already been shown this specific challenge? */
function alreadySeen(challengeId: string, profileId: string): boolean {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const seen: string[] = raw ? JSON.parse(raw) : []
    return seen.includes(`${profileId}:${challengeId}`)
  } catch {
    return false
  }
}

function markSeen(challengeId: string, profileId: string) {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const seen: string[] = raw ? JSON.parse(raw) : []
    const key = `${profileId}:${challengeId}`
    if (!seen.includes(key)) seen.push(key)
    // keep the list small -- only the last 20 challenges matter
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-20)))
  } catch { /* storage unavailable -- just don't remember */ }
}

/**
 * One-time, full-screen announcement of the week's challenge for a kid.
 * Kids were missing challenges entirely because the card sits below the fold on
 * the home screen. This makes the week's goal and its bonus impossible to miss,
 * and only shows once per kid per challenge.
 */
export function ChallengeAnnounce({ challenge, profileId }: { challenge: Challenge | null; profileId?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!challenge || !profileId) return
    if (challenge.completed) return
    if (alreadySeen(challenge.id, profileId)) return
    // let the home screen paint first so the pop-up lands as an event
    const t = setTimeout(() => setOpen(true), 450)
    return () => clearTimeout(t)
  }, [challenge?.id, challenge?.completed, profileId])

  function dismiss() {
    if (challenge && profileId) markSeen(challenge.id, profileId)
    setOpen(false)
  }

  if (!challenge) return null

  const goalLine =
    challenge.goal_type === 'no_misses'
      ? "Don't miss a single chore all week."
      : challenge.description.replace('{goal}', String(challenge.goal_value))

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(26,20,17,0.65)', backdropFilter: 'blur(3px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5 pointer-events-none">
            <motion.div
              className="w-full max-w-sm pointer-events-auto"
              initial={{ scale: 0.8, y: 24, opacity: 0, rotate: -3 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              style={{
                background: 'var(--cream)',
                border: '3px solid var(--ink)',
                borderRadius: 20,
                boxShadow: 'var(--shadow)',
                padding: 20,
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'inline-block', transform: 'rotate(-6deg)', filter: 'drop-shadow(var(--shadow))' }}>
                <SirFlush size={84} expression="wink" />
              </div>

              <div className="stadium-eyebrow mt-3" style={{ color: 'var(--red)' }}>THIS WEEK'S CHALLENGE</div>

              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 34,
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  color: 'var(--ink)',
                  textShadow: '4px 4px 0 var(--yellow)',
                  marginTop: 6,
                }}
              >
                {challenge.title.toUpperCase()}
              </div>

              <p className="font-bold mt-3" style={{ color: 'var(--ink-50)', fontSize: 14 }}>
                {goalLine}
              </p>

              <div
                className="flex items-center justify-center gap-2 mt-4"
                style={{
                  background: 'var(--yellow)',
                  border: '3px solid var(--ink)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Trophy size={18} strokeWidth={3} style={{ color: 'var(--ink)' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  +{challenge.bonus_points} BONUS POINTS
                </span>
              </div>

              <button
                onClick={dismiss}
                className="w-full mt-5"
                style={{
                  background: 'var(--green)',
                  color: '#fff',
                  border: '3px solid var(--ink)',
                  borderRadius: 12,
                  padding: '12px 0',
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  letterSpacing: '-0.02em',
                  textShadow: '2px 2px 0 var(--ink)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                }}
              >
                LET'S GO
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

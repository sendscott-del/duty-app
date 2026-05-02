import { useState } from 'react'
import { Trophy, RefreshCw } from 'lucide-react'
import { CHALLENGE_TEMPLATES, type Challenge } from '../lib/challenges'
import { ProgressBar } from './ui/ProgressBar'

interface WeeklyChallengeProps {
  challenge: Challenge | null
  progress: number
  isParent: boolean
  onSelect: (index: number) => void
}

export function WeeklyChallenge({ challenge, progress, isParent, onSelect }: WeeklyChallengeProps) {
  const [showPicker, setShowPicker] = useState(false)

  if (!challenge && !isParent) return null

  if (!challenge || showPicker) {
    if (!isParent && !challenge) return null
    return (
      <div
        style={{
          background: 'var(--ink)',
          color: 'var(--yellow)',
          border: '3px solid var(--ink)',
          borderRadius: 16,
          padding: 14,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div className="stadium-eyebrow mb-2" style={{ color: 'var(--yellow)', opacity: 0.85 }}>PICK A WEEKLY CHALLENGE</div>
        <div className="space-y-2">
          {CHALLENGE_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); setShowPicker(false) }}
              className="w-full text-left"
              style={{
                background: '#fff',
                color: 'var(--ink)',
                border: '2.5px solid var(--ink)',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer',
              }}
            >
              <div className="font-display text-lg" style={{ letterSpacing: '-0.02em' }}>{t.title}</div>
              <div className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>
                {t.description.replace('{goal}', String(t.goal_value))} · +{t.bonus_points} bonus pts
              </div>
            </button>
          ))}
        </div>
        {showPicker && (
          <button onClick={() => setShowPicker(false)} className="text-xs font-bold mt-2" style={{ color: 'var(--cream)' }}>
            Cancel
          </button>
        )}
      </div>
    )
  }

  const progressPct = challenge.goal_value > 0
    ? Math.min(100, (progress / challenge.goal_value) * 100)
    : challenge.completed ? 100 : 0

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: challenge.completed ? 'var(--green)' : 'var(--ink)',
        color: challenge.completed ? '#fff' : 'var(--yellow)',
        border: '3px solid var(--ink)',
        borderRadius: 16,
        padding: 14,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,210,63,0.06) 12px 14px)',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          {challenge.completed && <Trophy size={16} strokeWidth={3} />}
          <span className="stadium-eyebrow" style={{ color: challenge.completed ? '#fff' : 'var(--yellow)', opacity: 0.85 }}>
            WEEKLY CHALLENGE
          </span>
          {challenge.completed && (
            <span className="ml-auto text-xs font-bold" style={{ background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 999, padding: '2px 8px' }}>
              +{challenge.bonus_points} pts
            </span>
          )}
          {isParent && !challenge.completed && (
            <button
              onClick={() => setShowPicker(true)}
              className="ml-auto p-1"
              style={{ color: 'var(--yellow)', cursor: 'pointer' }}
              title="Change challenge"
            >
              <RefreshCw size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.03em', color: challenge.completed ? '#fff' : 'var(--yellow)' }}>
          {challenge.title}
        </div>
        <div className="text-xs font-bold mt-1" style={{ color: challenge.completed ? '#fff' : 'rgba(255,247,230,0.7)' }}>
          {challenge.description}
        </div>

        {!challenge.completed && (
          <div className="mt-3">
            <ProgressBar value={progressPct} color="gold" />
            <div className="text-xs font-bold mt-1.5" style={{ color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>
              {progress} / {challenge.goal_value} · {challenge.bonus_points} BONUS PTS
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

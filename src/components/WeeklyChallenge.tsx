import { useState } from 'react'
import { Target, Trophy, RefreshCw } from 'lucide-react'
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

  // Picker view
  if (!challenge || showPicker) {
    if (!isParent && !challenge) return null

    return (
      <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-border)' }}>
        <div className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
          Pick a Weekly Challenge
        </div>
        <div className="space-y-2">
          {CHALLENGE_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); setShowPicker(false) }}
              className="w-full text-left p-3 rounded-xl transition-colors"
              style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}
            >
              <div className="text-sm font-semibold" style={{ color: 'var(--p-text)' }}>{t.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--p-muted)' }}>
                {t.description.replace('{goal}', String(t.goal_value))} · +{t.bonus_points} bonus pts
              </div>
            </button>
          ))}
        </div>
        {showPicker && (
          <button onClick={() => setShowPicker(false)} className="text-xs" style={{ color: 'var(--p-muted)' }}>
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
    <div className="rounded-2xl p-4" style={{
      background: challenge.completed ? 'rgba(74,222,128,0.08)' : 'var(--gold-dim)',
      border: `1px solid ${challenge.completed ? 'var(--green-border)' : 'var(--gold-border)'}`,
    }}>
      <div className="flex items-center gap-2 mb-2">
        {challenge.completed
          ? <Trophy size={16} style={{ color: 'var(--green)' }} />
          : <Target size={16} style={{ color: 'var(--gold)' }} />
        }
        <span className="text-sm font-semibold" style={{ color: challenge.completed ? 'var(--green)' : 'var(--gold)' }}>
          Weekly Challenge
        </span>
        {challenge.completed && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
            style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            Complete! +{challenge.bonus_points} pts
          </span>
        )}
        {isParent && !challenge.completed && (
          <button
            onClick={() => setShowPicker(true)}
            className="ml-auto p-1 rounded transition-colors"
            style={{ color: 'var(--gold)' }}
            title="Change challenge"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
      <div className="text-sm font-medium mb-1" style={{ color: 'var(--p-text)' }}>{challenge.title}</div>
      <div className="text-xs mb-3" style={{ color: 'var(--p-muted)' }}>{challenge.description}</div>

      {!challenge.completed && (
        <>
          <ProgressBar value={progressPct} color="gold" />
          <div className="text-xs font-medium mt-1.5" style={{ color: 'var(--gold)' }}>
            {progress} / {challenge.goal_value} · {challenge.bonus_points} bonus pts
          </div>
        </>
      )}
    </div>
  )
}

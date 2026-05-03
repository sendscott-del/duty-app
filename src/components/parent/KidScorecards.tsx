import type { Profile } from '../../lib/store'
import { Avatar } from '../ui/Avatar'
import { getKidScore } from '../../lib/kidScores'

interface Props {
  kids: Profile[]
  chores: any[]
  completions: any[]
  onSelectKid?: (kid: Profile) => void
}

function trendTone(rate: number, weekTotal: number): { bg: string; fg: string; label: string } {
  if (weekTotal === 0) return { bg: '#fff', fg: 'var(--ink-50)', label: 'NO CHORES' }
  if (rate >= 80) return { bg: 'var(--green)', fg: '#fff', label: 'CRUSHING IT' }
  if (rate >= 50) return { bg: 'var(--yellow)', fg: 'var(--ink)', label: 'KEEPING UP' }
  return { bg: 'var(--red)', fg: '#fff', label: 'SLIPPING' }
}

export function KidScorecards({ kids, chores, completions, onSelectKid }: Props) {
  if (kids.length === 0) return null

  return (
    <div>
      <div className="stadium-eyebrow mb-2">KIDS · LAST 7 DAYS</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {kids.map(kid => {
          const score = getKidScore(kid.id, chores, completions)
          const tone = trendTone(score.weekRate, score.weekTotal)
          const Tag: any = onSelectKid ? 'button' : 'div'
          return (
            <Tag
              key={kid.id}
              onClick={onSelectKid ? () => onSelectKid(kid) : undefined}
              className="text-left transition-transform active:scale-[.98]"
              style={{
                background: '#fff',
                border: '2.5px solid var(--ink)',
                borderRadius: 'var(--r-lg)',
                boxShadow: 'var(--shadow-sm)',
                padding: '10px 12px',
                cursor: onSelectKid ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      letterSpacing: '-0.02em',
                      color: 'var(--ink)',
                    }}
                  >
                    {kid.full_name.split(' ')[0]}
                  </span>
                  <span
                    className="stadium-eyebrow"
                    style={{
                      background: tone.bg,
                      color: tone.fg,
                      border: '2px solid var(--ink)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 9,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tone.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold" style={{ color: 'var(--ink-50)' }}>
                  <span>
                    <span style={{ color: 'var(--ink)' }}>{score.weekRate}%</span> done
                  </span>
                  <span>·</span>
                  <span>
                    <span style={{ color: 'var(--ink)' }}>{score.weekDone}/{score.weekTotal}</span> chores
                  </span>
                  {score.streak > 0 && (
                    <>
                      <span>·</span>
                      <span style={{ color: 'var(--red)' }}>🔥 {score.streak}d streak</span>
                    </>
                  )}
                </div>
                {score.todayTotal > 0 && (
                  <div className="mt-1.5" style={{ height: 5, background: 'var(--ink-15)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (score.todayDone / score.todayTotal) * 100)}%`,
                        background: 'var(--green)',
                        transition: 'width 400ms ease-out',
                      }}
                    />
                  </div>
                )}
              </div>
            </Tag>
          )
        })}
      </div>
    </div>
  )
}

import { Lock } from 'lucide-react'
import { ProgressBar } from '../ui/ProgressBar'
import type { KidSkin } from '../../hooks/useKidSkin'

interface RewardCardProps {
  reward: any
  balance: number
  onClaim: (reward: any) => void
  skin?: KidSkin
}

const TILE_COLORS = ['var(--blue)', 'var(--red)', 'var(--pink)', 'var(--green)']

export function RewardCard({ reward, balance, onClaim, skin = 'younger' }: RewardCardProps) {
  const canAfford = balance >= reward.points_cost
  const progress = Math.min(100, (balance / reward.points_cost) * 100)

  if (skin === 'teen') {
    return (
      <button
        className="w-full text-left"
        onClick={() => canAfford && onClaim(reward)}
        disabled={!canAfford}
        style={{
          background: '#1a1a1c',
          border: '1.5px solid #333',
          borderRadius: 10,
          padding: '10px 12px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: canAfford ? 1 : 0.7,
          cursor: canAfford ? 'pointer' : 'not-allowed',
        }}
      >
        <div style={{ fontSize: 22 }}>{reward.emoji}</div>
        <div className="flex-1 min-w-0">
          <div style={{ fontWeight: 700, fontSize: 13 }}>{reward.name}</div>
          {!canAfford && (
            <div style={{ marginTop: 5, height: 3, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--yellow)' }} />
            </div>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: canAfford ? 'var(--yellow)' : '#666' }}>
          ★ {reward.points_cost}
        </div>
        {canAfford && (
          <div
            style={{
              padding: '4px 10px',
              background: 'var(--yellow)',
              color: 'var(--ink)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            Get
          </div>
        )}
      </button>
    )
  }

  // YOUNGER
  const color = canAfford
    ? TILE_COLORS[Math.abs(hash(reward.id || reward.name || '')) % TILE_COLORS.length]
    : '#bbb'

  return (
    <button
      className="w-full text-left relative flex flex-col items-center gap-1"
      onClick={() => canAfford && onClaim(reward)}
      disabled={!canAfford}
      style={{
        background: color,
        color: canAfford ? '#fff' : '#666',
        border: '3px solid var(--ink)',
        borderRadius: 18,
        padding: 12,
        boxShadow: canAfford ? 'var(--shadow)' : 'var(--shadow-sm)',
        aspectRatio: '0.95 / 1',
        opacity: canAfford ? 1 : 0.7,
        cursor: canAfford ? 'pointer' : 'not-allowed',
      }}
    >
      <div style={{ fontSize: 44, filter: canAfford ? 'none' : 'grayscale(0.5)' }}>{reward.emoji}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          letterSpacing: '-0.02em',
          textAlign: 'center',
          lineHeight: 1.05,
        }}
      >
        {reward.name}
      </div>
      <div
        style={{
          marginTop: 'auto',
          background: canAfford ? 'var(--yellow)' : '#fff',
          color: 'var(--ink)',
          border: '2px solid var(--ink)',
          borderRadius: 8,
          padding: '2px 10px',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        ★ {reward.points_cost}
      </div>
      {!canAfford && (
        <>
          <div
            className="absolute"
            style={{
              top: 6, right: 6,
              background: '#fff', color: 'var(--ink)',
              border: '1.5px solid var(--ink)',
              borderRadius: 4, padding: '0 3px',
            }}
          >
            <Lock size={10} />
          </div>
          <div className="absolute" style={{ bottom: 6, left: 8, right: 8 }}>
            <ProgressBar value={progress} color="gold" />
          </div>
        </>
      )}
    </button>
  )
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0
  return h
}

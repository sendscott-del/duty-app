import { Lock } from 'lucide-react'
import { ProgressBar } from '../ui/ProgressBar'

interface RewardCardProps {
  reward: any
  balance: number
  onClaim: (reward: any) => void
}

export function RewardCard({ reward, balance, onClaim }: RewardCardProps) {
  const canAfford = balance >= reward.points_cost
  const progress = Math.min(100, (balance / reward.points_cost) * 100)

  return (
    <button
      className="w-full rounded-2xl p-4 text-left min-h-[120px] flex flex-col justify-between"
      style={{
        background: canAfford ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${canAfford ? 'var(--gold-border)' : 'rgba(255,255,255,0.06)'}`,
        opacity: canAfford ? 1 : 0.6,
      }}
      onClick={() => canAfford && onClaim(reward)}
      disabled={!canAfford}
    >
      <div>
        <div className="text-2xl mb-2">{reward.emoji}</div>
        <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{reward.name}</div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>{reward.points_cost} pts</span>
          {!canAfford && <Lock size={12} style={{ color: 'var(--p-dim)' }} />}
        </div>
        {!canAfford && (
          <ProgressBar value={progress} color="gold" />
        )}
        {canAfford && (
          <div className="text-[11px] font-medium" style={{ color: 'var(--gold)' }}>Claim!</div>
        )}
      </div>
    </button>
  )
}

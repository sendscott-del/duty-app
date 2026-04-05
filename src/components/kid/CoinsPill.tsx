import { useCountUp } from '../../hooks/useCountUp'
import { Coins } from 'lucide-react'

export function CoinsPill({ points }: { points: number }) {
  const display = useCountUp(points)

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
      style={{
        background: 'var(--gold-dim)',
        color: 'var(--gold)',
        border: '1px solid var(--gold-border)',
      }}
    >
      <Coins size={14} />
      {display.toLocaleString()}
    </div>
  )
}

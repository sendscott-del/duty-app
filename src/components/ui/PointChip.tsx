import { useCountUp } from '../../hooks/useCountUp'

interface PointChipProps {
  points: number
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function PointChip({ points, size = 'md', animate = true }: PointChipProps) {
  const display = animate ? useCountUp(points) : points
  const scale = size === 'sm' ? { fs: 13, py: 4, px: 10, star: 12 }
    : size === 'lg' ? { fs: 20, py: 8, px: 16, star: 18 }
    : { fs: 16, py: 6, px: 12, star: 14 }

  return (
    <div
      className="inline-flex items-center gap-1"
      style={{
        background: 'var(--yellow)',
        color: 'var(--ink)',
        padding: `${scale.py}px ${scale.px}px`,
        borderRadius: 'var(--r-full)',
        border: '2.5px solid var(--ink)',
        fontFamily: 'var(--font-display)',
        fontSize: scale.fs,
        boxShadow: 'var(--shadow-sm)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: scale.star, lineHeight: 1 }}>★</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{display.toLocaleString()}</span>
    </div>
  )
}

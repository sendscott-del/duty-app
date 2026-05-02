interface StreakBadgeProps {
  days: number
  size?: 'sm' | 'md'
}

export function StreakBadge({ days, size = 'md' }: StreakBadgeProps) {
  const fs = size === 'sm' ? 12 : 14
  return (
    <div
      className="inline-flex items-center gap-1"
      style={{
        background: 'var(--red)',
        color: '#fff',
        padding: '4px 10px',
        borderRadius: 'var(--r-full)',
        border: '2.5px solid var(--ink)',
        fontFamily: 'var(--font-display)',
        fontSize: fs,
        boxShadow: 'var(--shadow-sm)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span>🔥</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{days}d</span>
    </div>
  )
}

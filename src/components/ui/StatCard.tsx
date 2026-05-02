type Tone = 'red' | 'yellow' | 'blue' | 'green' | 'pink' | 'cream' | 'dark'

const TONES: Record<Tone, { bg: string; fg: string }> = {
  red:    { bg: 'var(--red)',    fg: '#fff' },
  yellow: { bg: 'var(--yellow)', fg: 'var(--ink)' },
  blue:   { bg: 'var(--blue)',   fg: '#fff' },
  green:  { bg: 'var(--green)',  fg: '#fff' },
  pink:   { bg: 'var(--pink)',   fg: '#fff' },
  cream:  { bg: '#fff',          fg: 'var(--ink)' },
  dark:   { bg: 'var(--ink)',    fg: 'var(--yellow)' },
}

interface StadiumStatCardProps {
  label: string
  value: string | number
  tone?: Tone
  onClick?: () => void
  highlight?: boolean
}

export function StatCard({ label, value, tone = 'cream', onClick, highlight }: StadiumStatCardProps) {
  const { bg, fg } = TONES[highlight ? 'yellow' : tone]
  const Tag: any = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className="text-left transition-transform"
      style={{
        background: bg,
        color: fg,
        border: '2.5px solid var(--ink)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '12px 14px',
        minWidth: 120,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="stadium-eyebrow" style={{ color: fg, opacity: 0.85 }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          lineHeight: 1,
          marginTop: 4,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </div>
    </Tag>
  )
}

type Expression = 'happy' | 'wink' | 'cheer' | 'sleepy'

interface SirFlushProps {
  size?: number
  expression?: Expression
  className?: string
}

/**
 * Sir Flush — the regal toilet mascot.
 * Single inline SVG; scales infinitely. Two stroke weight at 3.5px to match Stadium.
 */
export function SirFlush({ size = 110, expression = 'happy', className }: SirFlushProps) {
  const eyes = (() => {
    if (expression === 'wink') {
      return (
        <g>
          <circle cx="42" cy="48" r="3.5" fill="#1a1411" />
          <path d="M54 48 Q60 46 66 48" stroke="#1a1411" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )
    }
    if (expression === 'cheer') {
      return (
        <g>
          <path d="M36 46 Q42 40 48 46" stroke="#1a1411" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M58 46 Q64 40 70 46" stroke="#1a1411" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      )
    }
    if (expression === 'sleepy') {
      return (
        <g>
          <path d="M36 50 L48 50" stroke="#1a1411" strokeWidth="3" strokeLinecap="round" />
          <path d="M58 50 L70 50" stroke="#1a1411" strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    }
    return (
      <g>
        <circle cx="42" cy="48" r="3.5" fill="#1a1411" />
        <circle cx="64" cy="48" r="3.5" fill="#1a1411" />
      </g>
    )
  })()

  const mouth = expression === 'cheer'
    ? <path d="M38 64 Q53 76 68 64 Q60 70 53 70 Q46 70 38 64 Z" fill="#ff3b30" stroke="#1a1411" strokeWidth="3" strokeLinejoin="round" />
    : expression === 'sleepy'
    ? <path d="M44 66 Q53 64 62 66" stroke="#1a1411" strokeWidth="3" fill="none" strokeLinecap="round" />
    : <path d="M40 60 Q53 68 66 60" stroke="#1a1411" strokeWidth="3" fill="none" strokeLinecap="round" />

  return (
    <svg
      viewBox="0 0 110 110"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
      aria-label="Sir Flush"
    >
      {/* crown */}
      <path
        d="M28 12 L36 4 L44 12 L52 2 L60 12 L68 4 L76 12 L76 20 L28 20 Z"
        fill="#ffd23f"
        stroke="#1a1411"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="52" cy="10" r="2.5" fill="#ff3b30" stroke="#1a1411" strokeWidth="1.5" />
      {/* tank */}
      <rect x="22" y="18" width="60" height="32" rx="6" fill="#fff" stroke="#1a1411" strokeWidth="3.5" />
      {eyes}
      {mouth}
      {/* cheeks */}
      <circle cx="32" cy="58" r="4" fill="#ff7eb6" opacity="0.7" />
      <circle cx="74" cy="58" r="4" fill="#ff7eb6" opacity="0.7" />
      {/* bowl */}
      <path
        d="M18 50 L88 50 L80 82 Q53 90 26 82 Z"
        fill="#fff"
        stroke="#1a1411"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* base shadow */}
      <ellipse cx="53" cy="84" rx="22" ry="3" fill="#1a1411" opacity="0.15" />
    </svg>
  )
}

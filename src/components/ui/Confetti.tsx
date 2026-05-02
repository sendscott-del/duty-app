import { useEffect, useState } from 'react'

interface ConfettiProps {
  count?: number
  /** When true, mount; when false, unmount. */
  active?: boolean
}

const COLORS = ['var(--red)', 'var(--yellow)', 'var(--blue)', 'var(--green)', 'var(--pink)']

/**
 * Stadium confetti — chunky shapes that fall from the top. Pure CSS animation.
 * Render inside a relatively-positioned container; absolute children fill the parent.
 */
export function Confetti({ count = 24, active = true }: ConfettiProps) {
  const [pieces, setPieces] = useState<{ x: number; delay: number; color: string; rot: number; shape: 'square' | 'tri' | 'circle' }[]>([])

  useEffect(() => {
    if (!active) return setPieces([])
    const next = Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.floor(Math.random() * 360),
      shape: (['square', 'tri', 'circle'] as const)[Math.floor(Math.random() * 3)],
    }))
    setPieces(next)
  }, [active, count])

  if (!active) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {pieces.map((p, i) => (
        <div
          key={i}
          className="stadium-confetti"
          style={{
            left: `${p.x}%`,
            top: '-30px',
            background: p.shape === 'tri' ? 'transparent' : p.color,
            borderRadius: p.shape === 'circle' ? '50%' : 0,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
            ...(p.shape === 'tri' && {
              width: 0,
              height: 0,
              border: 'none',
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: `12px solid ${p.color}`,
            } as any),
          }}
        />
      ))}
    </div>
  )
}

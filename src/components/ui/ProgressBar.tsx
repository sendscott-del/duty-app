import { motion } from 'framer-motion'

type Color = 'green' | 'gold' | 'red' | 'blue' | 'pink'

const COLORS: Record<Color, string> = {
  green: 'var(--green)',
  gold:  'var(--yellow)',
  red:   'var(--red)',
  blue:  'var(--blue)',
  pink:  'var(--pink)',
}

export function ProgressBar({ value, color = 'green' }: { value: number; color?: Color }) {
  return (
    <div
      className="w-full h-3 overflow-hidden"
      style={{
        background: '#fff',
        border: '2px solid var(--ink)',
        borderRadius: 'var(--r-full)',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', background: COLORS[color] }}
      />
    </div>
  )
}

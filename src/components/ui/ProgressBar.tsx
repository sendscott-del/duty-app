import { motion } from 'framer-motion'

export function ProgressBar({ value, color = 'green' }: { value: number; color?: 'green' | 'gold' }) {
  const colors = {
    green: 'bg-[var(--green)]',
    gold: 'bg-[var(--gold)]',
  }
  return (
    <div className="w-full h-2 rounded-full bg-[var(--p-card)] overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${colors[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

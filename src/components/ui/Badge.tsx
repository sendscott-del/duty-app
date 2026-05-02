type Variant = 'gold' | 'green' | 'amber' | 'red' | 'blue' | 'pink' | 'muted' | 'dark'

const STYLES: Record<Variant, React.CSSProperties> = {
  gold:  { background: 'var(--yellow)', color: 'var(--ink)' },
  green: { background: 'var(--green)',  color: '#fff' },
  amber: { background: 'var(--yellow)', color: 'var(--ink)' },
  red:   { background: 'var(--red)',    color: '#fff' },
  blue:  { background: 'var(--blue)',   color: '#fff' },
  pink:  { background: 'var(--pink)',   color: '#fff' },
  muted: { background: '#fff',          color: 'var(--ink)' },
  dark:  { background: 'var(--ink)',    color: 'var(--yellow)' },
}

export function Badge({ children, variant = 'gold', className = '' }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${className}`}
      style={{ ...STYLES[variant], border: '2px solid var(--ink)' }}
    >
      {children}
    </span>
  )
}

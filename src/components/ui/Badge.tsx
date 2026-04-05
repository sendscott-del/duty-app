const VARIANTS: Record<string, string> = {
  gold: 'bg-[var(--gold-dim)] text-[var(--gold)] border border-[var(--gold-border)]',
  green: 'bg-[var(--green-dim)] text-[var(--green)] border border-[var(--green-border)]',
  amber: 'bg-[var(--amber-dim)] text-[var(--amber)] border border-[rgba(251,191,36,0.3)]',
  red: 'bg-[rgba(248,113,113,0.1)] text-[var(--red)] border border-[rgba(248,113,113,0.3)]',
  muted: 'bg-[var(--p-card)] text-[var(--p-muted)] border border-[var(--p-border)]',
}

export function Badge({ children, variant = 'gold' }: { children: React.ReactNode; variant?: keyof typeof VARIANTS }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}

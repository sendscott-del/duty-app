export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl p-4 min-w-[140px]" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
      <div className="text-2xl font-display font-bold" style={{ color: 'var(--p-text)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--p-muted)' }}>{label}</div>
    </div>
  )
}

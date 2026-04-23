export function StatCard({ label, value, onClick, highlight }: { label: string; value: string | number; onClick?: () => void; highlight?: boolean }) {
  const content = (
    <>
      <div className="text-2xl font-display font-bold" style={{ color: highlight ? 'var(--amber)' : 'var(--p-text)' }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: 'var(--p-muted)' }}>{label}</div>
    </>
  )
  const baseStyle = {
    background: 'var(--p-card)',
    border: `1px solid ${highlight ? 'var(--amber)' : 'var(--p-border)'}`,
  }
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="rounded-xl p-4 min-w-[140px] text-left transition-colors hover:bg-white/[0.06] active:bg-white/[0.06]"
        style={baseStyle}
      >
        {content}
      </button>
    )
  }
  return (
    <div className="rounded-xl p-4 min-w-[140px]" style={baseStyle}>
      {content}
    </div>
  )
}

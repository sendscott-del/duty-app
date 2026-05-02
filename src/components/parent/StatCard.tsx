import { StatCard as StadiumStatCard } from '../ui/StatCard'

/** Legacy parent StatCard wrapper — keeps old call signature, delegates to Stadium StatCard. */
export function StatCard({ label, value, onClick, highlight }: { label: string; value: string | number; onClick?: () => void; highlight?: boolean }) {
  return <StadiumStatCard label={label} value={value} onClick={onClick} highlight={highlight} />
}

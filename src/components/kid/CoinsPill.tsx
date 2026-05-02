import { PointChip } from '../ui/PointChip'

/** Legacy alias — kept so older imports still work. New code should import PointChip directly. */
export function CoinsPill({ points }: { points: number }) {
  return <PointChip points={points} size="md" />
}

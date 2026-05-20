import { useStore } from '../lib/store'

export function useRewards() {
  const rewards = useStore((s) => s.rewards)
  const redemptions = useStore((s) => s.redemptions)
  const loading = useStore((s) => s.dataLoading)
  return { rewards, redemptions, loading }
}

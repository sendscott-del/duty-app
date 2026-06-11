import { useStore } from '../lib/store'

export function usePremium() {
  const family = useStore((s) => s.family)
  const isPremium =
    family?.premium_status === 'active' &&
    (!family.premium_period_end || new Date(family.premium_period_end) > new Date())
  return { isPremium }
}

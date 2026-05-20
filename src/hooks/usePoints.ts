import { useCallback, useMemo } from 'react'
import { useStore } from '../lib/store'

export function usePoints(profileId?: string) {
  const all = useStore((s) => s.pointTransactions)
  const loading = useStore((s) => s.dataLoading)

  const transactions = useMemo(
    () => (profileId ? all.filter((t) => t.profile_id === profileId) : all),
    [all, profileId]
  )

  const balance = useMemo(
    () => transactions.reduce((sum: number, t: any) => sum + t.amount, 0),
    [transactions]
  )

  const refresh = useCallback(async () => {}, [])

  return { transactions, balance, loading, refresh }
}

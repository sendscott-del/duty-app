import { useEffect, useState, useCallback } from 'react'
import { supabase, channelName } from '../lib/supabase'
import { useStore } from '../lib/store'

export function usePoints(profileId?: string) {
  const { family } = useStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchPoints = useCallback(async () => {
    if (!family?.id) { setLoading(false); return }

    let query = supabase
      .from('duty_point_transactions')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })

    if (profileId) query = query.eq('profile_id', profileId)

    const { data } = await query
    const txns = data ?? []
    setTransactions(txns)
    setBalance(txns.reduce((sum: number, t: any) => sum + t.amount, 0))
    setLoading(false)
  }, [family?.id, profileId])

  useEffect(() => {
    fetchPoints()
    if (!family?.id) return

    const channel = supabase
      .channel(channelName('points'))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'duty_point_transactions',
        filter: `family_id=eq.${family.id}`
      }, ({ eventType, new: row, old }) => {
        const txn = (row ?? old) as any
        if (profileId && txn?.profile_id !== profileId) {
          // Might be a delete where new is null — refetch to be safe
          if (eventType === 'DELETE') fetchPoints()
          return
        }

        if (eventType === 'INSERT') {
          setTransactions(p => [txn, ...p])
          setBalance(b => b + txn.amount)
        } else if (eventType === 'DELETE') {
          // Refetch for accuracy — delete events don't always have full data
          fetchPoints()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id, profileId, fetchPoints])

  return { transactions, balance, loading, refresh: fetchPoints }
}

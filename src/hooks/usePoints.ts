import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export function usePoints(profileId?: string) {
  const { family } = useStore()
  const [transactions, setTransactions] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!family?.id) return

    let query = supabase
      .from('duty_point_transactions')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })

    if (profileId) query = query.eq('profile_id', profileId)

    query.then(({ data }) => {
      const txns = data ?? []
      setTransactions(txns)
      setBalance(txns.reduce((sum: number, t: any) => sum + t.amount, 0))
      setLoading(false)
    })

    const channel = supabase
      .channel(`points-${profileId ?? 'all'}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'duty_point_transactions',
        filter: `family_id=eq.${family.id}`
      }, ({ new: row }) => {
        const txn = row as any
        if (profileId && txn.profile_id !== profileId) return
        setTransactions(p => [txn, ...p])
        setBalance(b => b + txn.amount)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id, profileId])

  return { transactions, balance, loading }
}

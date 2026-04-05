import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export function useChores() {
  const { family } = useStore()
  const [chores, setChores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!family?.id) return

    supabase
      .from('duty_chores')
      .select('*, duty_profiles!assigned_to(full_name, avatar_color)')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setChores(data ?? []); setLoading(false) })

    const channel = supabase
      .channel('chores')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'duty_chores',
        filter: `family_id=eq.${family.id}`
      }, ({ eventType, new: updated, old }) => {
        if (eventType === 'INSERT') setChores(p => [updated as any, ...p])
        if (eventType === 'UPDATE') setChores(p => p.map(c => c.id === (updated as any).id ? { ...c, ...(updated as any) } : c))
        if (eventType === 'DELETE') setChores(p => p.filter(c => c.id !== (old as any).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id])

  return { chores, loading }
}

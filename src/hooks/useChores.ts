import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export function useChores() {
  const { family } = useStore()
  const [chores, setChores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChores = useCallback(async () => {
    if (!family?.id) return
    const { data } = await supabase
      .from('duty_chores')
      .select('*, duty_profiles!assigned_to(full_name, avatar_color)')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })
    setChores(data ?? [])
    setLoading(false)
  }, [family?.id])

  useEffect(() => {
    fetchChores()

    if (!family?.id) return

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
  }, [family?.id, fetchChores])

  async function deleteChore(id: string) {
    setChores(p => p.filter(c => c.id !== id))
    await supabase.from('duty_chores').delete().eq('id', id)
  }

  return { chores, loading, deleteChore, refresh: fetchChores }
}

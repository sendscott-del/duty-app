import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export function useChores() {
  const chores = useStore((s) => s.chores)
  const loading = useStore((s) => s.dataLoading)
  const removeChore = useStore((s) => s.removeChore)

  const deleteChore = useCallback(async (id: string) => {
    removeChore(id)
    await supabase.from('duty_chores').delete().eq('id', id)
  }, [removeChore])

  // `refresh` is kept as a no-op for legacy callers (AddChoreSheet's onSaved).
  // Realtime keeps the store fresh; an explicit refetch is no longer needed.
  const refresh = useCallback(async () => {}, [])

  return { chores, loading, deleteChore, refresh }
}

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export interface ChoreCompletion {
  id: string
  chore_id: string
  completed_by: string
  completion_date: string
  status: 'submitted' | 'approved' | 'rejected'
  completed_late: boolean
  approved_at: string | null
  approved_by: string | null
  proof_image_url: string | null
  created_at: string
}

export function useCompletions() {
  const { family } = useStore()
  const [completions, setCompletions] = useState<ChoreCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompletions = useCallback(async () => {
    if (!family?.id) { setLoading(false); return }
    const { data } = await supabase
      .from('duty_chore_completions')
      .select('*')
      .order('created_at', { ascending: false })
    setCompletions((data ?? []) as ChoreCompletion[])
    setLoading(false)
  }, [family?.id])

  useEffect(() => {
    fetchCompletions()
    if (!family?.id) return

    const channelName = `completions-${family.id}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'duty_chore_completions',
      }, ({ eventType, new: updated, old }) => {
        if (eventType === 'INSERT') setCompletions(p => [updated as any, ...p])
        if (eventType === 'UPDATE') setCompletions(p => p.map(c => c.id === (updated as any).id ? (updated as any) : c))
        if (eventType === 'DELETE') setCompletions(p => p.filter(c => c.id !== (old as any).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id, fetchCompletions])

  function getCompletion(choreId: string, date: string): ChoreCompletion | undefined {
    return completions.find(c => c.chore_id === choreId && c.completion_date === date)
  }

  async function completeChore(choreId: string, completedBy: string, date: string, isLate: boolean) {
    const { data } = await supabase.from('duty_chore_completions').upsert({
      chore_id: choreId,
      completed_by: completedBy,
      completion_date: date,
      status: 'submitted',
      completed_late: isLate,
    }, { onConflict: 'chore_id,completion_date' }).select().single()

    if (data) setCompletions(p => {
      const existing = p.findIndex(c => c.chore_id === choreId && c.completion_date === date)
      if (existing >= 0) { const n = [...p]; n[existing] = data as any; return n }
      return [data as any, ...p]
    })
  }

  async function approveCompletion(completionId: string, approvedBy: string) {
    await supabase.from('duty_chore_completions').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    }).eq('id', completionId)
  }

  async function undoCompletion(choreId: string, date: string) {
    const comp = getCompletion(choreId, date)
    if (!comp) return

    const completionId = comp.id

    // Remove from local state immediately
    setCompletions(p => p.filter(c => c.id !== completionId))

    // Remove the completion record
    await supabase.from('duty_chore_completions').delete().eq('id', completionId)

    // Remove the specific point transaction linked to this completion
    await supabase.from('duty_point_transactions')
      .delete()
      .eq('reference_id', completionId)
      .eq('reference_type', 'chore')

    return completionId
  }

  return { completions, loading, getCompletion, completeChore, approveCompletion, undoCompletion, refresh: fetchCompletions }
}

import { useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useStore, type ChoreCompletion } from '../lib/store'

export type { ChoreCompletion }

export function useCompletions() {
  const completions = useStore((s) => s.completions)
  const loading = useStore((s) => s.dataLoading)
  const upsertCompletion = useStore((s) => s.upsertCompletion)
  const removeCompletion = useStore((s) => s.removeCompletion)
  const removePointTransactionsByCompletion = useStore((s) => s.removePointTransactionsByCompletion)

  // Map keyed by `${choreId}|${date}` so getCompletion is O(1) instead of an
  // O(N) .find scan on every chore row, every render.
  const completionByKey = useMemo(() => {
    const m = new Map<string, ChoreCompletion>()
    for (const c of completions) m.set(`${c.chore_id}|${c.completion_date}`, c)
    return m
  }, [completions])

  const getCompletion = useCallback(
    (choreId: string, date: string): ChoreCompletion | undefined =>
      completionByKey.get(`${choreId}|${date}`),
    [completionByKey]
  )

  const completeChore = useCallback(async (choreId: string, completedBy: string, date: string, isLate: boolean) => {
    const { data } = await supabase
      .from('duty_chore_completions')
      .upsert(
        {
          chore_id: choreId,
          completed_by: completedBy,
          completion_date: date,
          status: 'submitted',
          completed_late: isLate,
        },
        { onConflict: 'chore_id,completion_date' }
      )
      .select()
      .single()

    if (data) upsertCompletion(data as ChoreCompletion)
  }, [upsertCompletion])

  const approveCompletion = useCallback(async (completionId: string, approvedBy: string) => {
    const approvedAt = new Date().toISOString()
    // Optimistic: mark approved locally so the UI updates instantly.
    const existing = useStore.getState().completions.find((c) => c.id === completionId)
    if (existing) {
      upsertCompletion({ ...existing, status: 'approved', approved_at: approvedAt, approved_by: approvedBy })
    }
    await supabase.from('duty_chore_completions').update({
      status: 'approved',
      approved_at: approvedAt,
      approved_by: approvedBy,
    }).eq('id', completionId)
  }, [upsertCompletion])

  const rejectCompletion = useCallback(async (completionId: string) => {
    const { data } = await supabase
      .from('duty_chore_completions')
      .update({ status: 'rejected', approved_at: null, approved_by: null })
      .eq('id', completionId)
      .select()
      .single()
    if (data) upsertCompletion(data as ChoreCompletion)
  }, [upsertCompletion])

  const unapproveCompletion = useCallback(async (completionId: string) => {
    const { data } = await supabase
      .from('duty_chore_completions')
      .update({ status: 'submitted', approved_at: null, approved_by: null })
      .eq('id', completionId)
      .select()
      .single()
    if (data) upsertCompletion(data as ChoreCompletion)

    removePointTransactionsByCompletion(completionId)
    await supabase.from('duty_point_transactions')
      .delete()
      .eq('reference_id', completionId)
      .eq('reference_type', 'chore')
  }, [upsertCompletion, removePointTransactionsByCompletion])

  const undoCompletion = useCallback(async (choreId: string, date: string) => {
    const all = useStore.getState().completions
    const comp = all.find((c) => c.chore_id === choreId && c.completion_date === date)
    if (!comp) return
    const completionId = comp.id

    removeCompletion(completionId)
    removePointTransactionsByCompletion(completionId)

    await supabase.from('duty_chore_completions').delete().eq('id', completionId)
    await supabase.from('duty_point_transactions')
      .delete()
      .eq('reference_id', completionId)
      .eq('reference_type', 'chore')

    return completionId
  }, [removeCompletion, removePointTransactionsByCompletion])

  const refresh = useCallback(async () => {}, [])

  return {
    completions,
    loading,
    getCompletion,
    completeChore,
    approveCompletion,
    rejectCompletion,
    unapproveCompletion,
    undoCompletion,
    refresh,
  }
}

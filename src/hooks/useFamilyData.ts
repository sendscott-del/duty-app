import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore, type ChoreCompletion } from '../lib/store'
import type { Challenge } from '../lib/challenges'

function currentWeekStart(): string {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return start.toISOString().split('T')[0]
}

/**
 * Bootstraps a single fetch + realtime subscription per family.id.
 * Mount once per session (from ParentShell / KidShell). Every data hook
 * reads from the store this populates — no per-page fetch, no per-page channel.
 */
export function useFamilyData() {
  const familyId = useStore((s) => s.family?.id ?? null)

  useEffect(() => {
    if (!familyId) {
      useStore.getState().clearFamilyData()
      return
    }

    let cancelled = false
    const weekStart = currentWeekStart()

    useStore.getState().setDataLoading(true)

    Promise.all([
      supabase
        .from('duty_chores')
        .select('*, duty_profiles!assigned_to(full_name, avatar_color, avatar_url)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('duty_chore_completions')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('duty_rewards')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_active', true),
      supabase
        .from('duty_redemptions')
        .select('*, duty_profiles!redeemed_by(full_name, avatar_color), duty_rewards(*)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('duty_point_transactions')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('duty_challenges')
        .select('*')
        .eq('family_id', familyId)
        .eq('week_start', weekStart)
        .maybeSingle(),
    ]).then(([chores, completions, rewards, redemptions, points, challenge]) => {
      if (cancelled) return
      useStore.getState().hydrateFamilyData({
        chores: chores.data ?? [],
        completions: (completions.data ?? []) as ChoreCompletion[],
        rewards: rewards.data ?? [],
        redemptions: redemptions.data ?? [],
        pointTransactions: points.data ?? [],
        challenge: (challenge.data as Challenge | null) ?? null,
      })
    })

    const channel = supabase
      .channel(`family-${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_chores', filter: `family_id=eq.${familyId}` },
        ({ eventType, new: newRow, old }) => {
          const s = useStore.getState()
          if (eventType === 'INSERT' || eventType === 'UPDATE') s.upsertChore(newRow as any)
          else if (eventType === 'DELETE') s.removeChore((old as any).id)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_chore_completions' },
        ({ eventType, new: newRow, old }) => {
          const s = useStore.getState()
          if (eventType === 'INSERT' || eventType === 'UPDATE') s.upsertCompletion(newRow as ChoreCompletion)
          else if (eventType === 'DELETE') s.removeCompletion((old as any).id)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_rewards', filter: `family_id=eq.${familyId}` },
        ({ eventType, new: newRow, old }) => {
          const s = useStore.getState()
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            const row = newRow as any
            if (row.is_active === false) s.removeReward(row.id)
            else s.upsertReward(row)
          } else if (eventType === 'DELETE') s.removeReward((old as any).id)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_redemptions', filter: `family_id=eq.${familyId}` },
        ({ eventType, new: newRow, old }) => {
          const s = useStore.getState()
          if (eventType === 'INSERT' || eventType === 'UPDATE') s.upsertRedemption(newRow as any)
          else if (eventType === 'DELETE') s.removeRedemption((old as any).id)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_point_transactions', filter: `family_id=eq.${familyId}` },
        ({ eventType, new: newRow, old }) => {
          const s = useStore.getState()
          if (eventType === 'INSERT') s.addPointTransaction(newRow as any)
          else if (eventType === 'DELETE') {
            // Old row may carry reference_id when REPLICA IDENTITY FULL is set.
            const ref = (old as any)?.reference_id
            if (ref) s.removePointTransactionsByCompletion(ref)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'duty_challenges', filter: `family_id=eq.${familyId}` },
        ({ eventType, new: newRow, old }) => {
          const s = useStore.getState()
          const row = newRow as Challenge | undefined
          if (eventType === 'DELETE') {
            const current = s.challenge
            if (current && current.id === (old as any).id) s.setChallenge(null)
            return
          }
          if (!row || row.week_start !== weekStart) return
          s.setChallenge(row)
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [familyId])
}

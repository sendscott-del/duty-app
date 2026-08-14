import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

// Same joins the initial fetch in useFamilyData uses, so a row written back
// into the store still renders the kid's name and the reward's emoji/name.
const REDEMPTION_SELECT = '*, duty_profiles!redeemed_by(full_name, avatar_color), duty_rewards(*)'

export function useRewards() {
  const rewards = useStore((s) => s.rewards)
  const redemptions = useStore((s) => s.redemptions)
  const loading = useStore((s) => s.dataLoading)
  const upsertRedemption = useStore((s) => s.upsertRedemption)
  const removeReward = useStore((s) => s.removeReward)

  // Every mutation writes the returned row straight into the store instead of
  // waiting on the realtime channel (same pattern as useCompletions). Returns
  // an error for the caller to surface — a bare `.update()` reports RLS refusals
  // as a silent success, which is how approve/reject looked like dead buttons.
  const setRedemptionStatus = useCallback(
    async (id: string, status: 'approved' | 'rejected' | 'fulfilled') => {
      const { data, error } = await supabase
        .from('duty_redemptions')
        .update({ status })
        .eq('id', id)
        .select(REDEMPTION_SELECT)
        .single()
      if (error) return error
      if (data) upsertRedemption(data)
      return null
    },
    [upsertRedemption]
  )

  const approveRedemption = useCallback(
    (id: string) => setRedemptionStatus(id, 'approved'),
    [setRedemptionStatus]
  )
  const rejectRedemption = useCallback(
    (id: string) => setRedemptionStatus(id, 'rejected'),
    [setRedemptionStatus]
  )
  const fulfillRedemption = useCallback(
    (id: string) => setRedemptionStatus(id, 'fulfilled'),
    [setRedemptionStatus]
  )

  const deactivateReward = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('duty_rewards')
        .update({ is_active: false })
        .eq('id', id)
        .select('id')
        .single()
      if (error) return error
      removeReward(id)
      return null
    },
    [removeReward]
  )

  return {
    rewards,
    redemptions,
    loading,
    approveRedemption,
    rejectRedemption,
    fulfillRedemption,
    deactivateReward,
  }
}

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
  const addPointTransaction = useStore((s) => s.addPointTransaction)
  const removeReward = useStore((s) => s.removeReward)

  // Every mutation writes the returned row straight into the store instead of
  // waiting on the realtime channel (same pattern as useCompletions). Returns
  // an error for the caller to surface — a bare `.update()` reports RLS refusals
  // as a silent success, which is how approve/reject looked like dead buttons.
  //
  // `from` pins the transition to the status the UI was showing, so a stale tab
  // or a second parent acting at the same time can't re-run a transition. That
  // matters most for reject, which refunds points.
  const setRedemptionStatus = useCallback(
    async (id: string, from: string, status: 'approved' | 'rejected' | 'fulfilled') => {
      const { data, error } = await supabase
        .from('duty_redemptions')
        .update({ status })
        .eq('id', id)
        .eq('status', from)
        .select(REDEMPTION_SELECT)
        .single()
      // PGRST116 = no row matched, i.e. someone already moved this request on.
      if (error) {
        return error.code === 'PGRST116'
          ? { ...error, message: 'That request was already handled — refresh to see its current status.' }
          : error
      }
      if (data) upsertRedemption(data)
      return null
    },
    [upsertRedemption]
  )

  const approveRedemption = useCallback(
    (id: string) => setRedemptionStatus(id, 'pending', 'approved'),
    [setRedemptionStatus]
  )

  // Rejecting refunds the points. The kid was charged at claim time, so without
  // this a "no" silently costs them the full price of a reward they never got.
  const rejectRedemption = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
        .from('duty_redemptions')
        .update({ status: 'rejected' })
        .eq('id', id)
        .eq('status', 'pending')
        .select(REDEMPTION_SELECT)
        .single()
      if (error) {
        return error.code === 'PGRST116'
          ? { ...error, message: 'That request was already handled — refresh to see its current status.' }
          : error
      }
      upsertRedemption(data)

      const parentId = useStore.getState().profile?.id
      const { data: refund, error: refundError } = await supabase
        .from('duty_point_transactions')
        .insert({
          family_id: data.family_id,
          profile_id: data.redeemed_by,
          amount: data.points_spent,
          reason: `Refund: ${data.duty_rewards?.name ?? 'reward'} request declined`,
          reference_id: data.id,
          reference_type: 'bonus',
          created_by: parentId,
        })
        .select()
        .single()
      // The rejection itself stuck; report a failed refund rather than hiding it.
      if (refundError) return refundError
      if (refund) addPointTransaction(refund)
      return null
    },
    [upsertRedemption, addPointTransaction]
  )

  const fulfillRedemption = useCallback(
    (id: string) => setRedemptionStatus(id, 'approved', 'fulfilled'),
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

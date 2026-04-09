import { useEffect, useState } from 'react'
import { supabase, channelName } from '../lib/supabase'
import { useStore } from '../lib/store'

export function useRewards() {
  const { family } = useStore()
  const [rewards, setRewards] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!family?.id) { setLoading(false); return }

    Promise.all([
      supabase.from('duty_rewards').select('*').eq('family_id', family.id).eq('is_active', true),
      supabase.from('duty_redemptions').select('*, duty_profiles!redeemed_by(full_name, avatar_color), duty_rewards(*)').eq('family_id', family.id).order('created_at', { ascending: false }),
    ]).then(([r, d]) => {
      setRewards(r.data ?? [])
      setRedemptions(d.data ?? [])
      setLoading(false)
    })

    const channel = supabase
      .channel(channelName('redemptions'))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'duty_redemptions',
        filter: `family_id=eq.${family.id}`
      }, ({ eventType, new: updated }) => {
        if (eventType === 'INSERT') setRedemptions(p => [updated as any, ...p])
        if (eventType === 'UPDATE') setRedemptions(p => p.map(r => r.id === (updated as any).id ? { ...r, ...(updated as any) } : r))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [family?.id])

  return { rewards, redemptions, loading }
}

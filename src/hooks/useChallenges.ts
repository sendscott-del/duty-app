import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'
import { CHALLENGE_TEMPLATES, type Challenge } from '../lib/challenges'

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
  }
}

export function useChallenges() {
  const challenge = useStore((s) => s.challenge)
  const loading = useStore((s) => s.dataLoading)
  const setChallenge = useStore((s) => s.setChallenge)

  const selectChallenge = useCallback(async (templateIndex: number) => {
    const family = useStore.getState().family
    if (!family?.id) return
    const { weekStart, weekEnd } = getWeekBounds()

    const existing = useStore.getState().challenge
    if (existing) {
      setChallenge(null)
      await supabase.from('duty_challenges').delete().eq('id', existing.id)
    }

    const t = CHALLENGE_TEMPLATES[templateIndex]
    const { data } = await supabase
      .from('duty_challenges')
      .insert({
        family_id: family.id,
        title: t.title,
        description: t.description.replace('{goal}', String(t.goal_value)),
        goal_type: t.goal_type,
        goal_value: t.goal_value,
        bonus_points: t.bonus_points,
        week_start: weekStart,
        week_end: weekEnd,
      })
      .select()
      .single()

    if (data) setChallenge(data as Challenge)
  }, [setChallenge])

  const completeChallenge = useCallback(async () => {
    const current = useStore.getState().challenge
    if (!current) return
    const completedAt = new Date().toISOString()
    setChallenge({ ...current, completed: true, completed_at: completedAt })
    await supabase.from('duty_challenges').update({
      completed: true,
      completed_at: completedAt,
    }).eq('id', current.id)
  }, [setChallenge])

  const refresh = useCallback(async () => {}, [])

  return { challenge, loading, selectChallenge, completeChallenge, refresh }
}

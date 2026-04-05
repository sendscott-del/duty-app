import { useState, useEffect, useCallback } from 'react'
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
  const { family } = useStore()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const { weekStart, weekEnd } = getWeekBounds()

  const fetchChallenge = useCallback(async () => {
    if (!family?.id) return
    const { data } = await supabase
      .from('duty_challenges')
      .select('*')
      .eq('family_id', family.id)
      .eq('week_start', weekStart)
      .maybeSingle()

    setChallenge(data as Challenge | null)
    setLoading(false)
  }, [family?.id, weekStart])

  useEffect(() => { fetchChallenge() }, [fetchChallenge])

  async function selectChallenge(templateIndex: number) {
    if (!family?.id) return

    // Delete existing challenge for this week
    if (challenge) {
      await supabase.from('duty_challenges').delete().eq('id', challenge.id)
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
  }

  async function completeChallenge() {
    if (!challenge) return
    await supabase.from('duty_challenges').update({
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', challenge.id)
    setChallenge({ ...challenge, completed: true, completed_at: new Date().toISOString() })
  }

  return { challenge, loading, selectChallenge, completeChallenge, refresh: fetchChallenge }
}

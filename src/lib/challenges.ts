export const CHALLENGE_TEMPLATES = [
  {
    title: 'Toilet Team Takedown',
    description: 'Flush out {goal} chores as a family this week',
    goal_type: 'family_completions' as const,
    goal_value: 20,
    bonus_points: 15,
  },
  {
    title: 'Streak Squad',
    description: "Every family member keeps a {goal}+ day streak going. Don't break the chain!",
    goal_type: 'all_streaks' as const,
    goal_value: 3,
    bonus_points: 20,
  },
  {
    title: 'No Clog Week',
    description: 'Zero missed chores all week. Keep the pipes clean!',
    goal_type: 'no_misses' as const,
    goal_value: 0,
    bonus_points: 25,
  },
  {
    title: 'Mega Flush',
    description: 'The family drops {goal} duties this week. Let it rip!',
    goal_type: 'family_completions' as const,
    goal_value: 30,
    bonus_points: 20,
  },
  {
    title: "Plumber's Marathon",
    description: 'Every family member hits a {goal}+ day streak. No leaks!',
    goal_type: 'all_streaks' as const,
    goal_value: 5,
    bonus_points: 25,
  },
]

export interface Challenge {
  id: string
  family_id: string
  title: string
  description: string
  goal_type: 'family_completions' | 'all_streaks' | 'no_misses'
  goal_value: number
  bonus_points: number
  week_start: string
  week_end: string
  completed: boolean
  completed_at: string | null
  created_at: string
}

/**
 * Calculate challenge progress based on goal_type.
 * - family_completions: count of approved completions this week
 * - all_streaks: minimum consecutive-day streak across all kids (each kid must complete ALL their chores that day)
 * - no_misses: 1 if no misses this week, 0 otherwise
 */
export function calcChallengeProgress(
  challenge: Challenge,
  completions: { chore_id: string; completion_date: string; status: string; completed_by: string }[],
  chores: { id: string; assigned_to: string; recurrence: string; recurrence_days?: number[] | null; due_date?: string | null }[],
  kidIds: string[],
): number {
  const weekApproved = completions.filter(c =>
    c.status === 'approved' && c.completion_date >= challenge.week_start && c.completion_date <= challenge.week_end
  )

  if (challenge.goal_type === 'family_completions') {
    return weekApproved.length
  }

  if (challenge.goal_type === 'all_streaks') {
    if (kidIds.length === 0) return 0

    // For each kid, calculate consecutive days (ending today, going backward) where they completed ALL their chores
    const today = new Date()
    const minStreak = Math.min(...kidIds.map(kidId => {
      let streak = 0
      for (let offset = 0; offset < 7; offset++) {
        const d = new Date(today)
        d.setDate(today.getDate() - offset)
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (ds < challenge.week_start) break

        // Chores due for this kid on this day
        const dayOfWeek = d.getDay()
        const kidChores = chores.filter(c => {
          if (c.assigned_to !== kidId) return false
          if (c.recurrence === 'daily') return true
          if (c.recurrence === 'weekly') {
            if (!c.recurrence_days?.length) return true
            return c.recurrence_days.includes(dayOfWeek)
          }
          if (c.recurrence === 'monthly') return true
          return c.due_date === ds
        })

        if (kidChores.length === 0) { streak++; continue } // no chores = doesn't break streak

        const allDone = kidChores.every(ch =>
          weekApproved.some(comp => comp.chore_id === ch.id && comp.completion_date === ds)
        )

        if (allDone) streak++
        else break
      }
      return streak
    }))

    return minStreak
  }

  if (challenge.goal_type === 'no_misses') {
    // Check every day from week_start to today — if any kid missed any chore, return 0
    const today = new Date()
    const start = new Date(challenge.week_start + 'T00:00:00')
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const dayOfWeek = d.getDay()

      for (const kidId of kidIds) {
        const kidChores = chores.filter(c => {
          if (c.assigned_to !== kidId) return false
          if (c.recurrence === 'daily') return true
          if (c.recurrence === 'weekly') {
            if (!c.recurrence_days?.length) return true
            return c.recurrence_days.includes(dayOfWeek)
          }
          if (c.recurrence === 'monthly') return true
          return c.due_date === ds
        })

        const allDone = kidChores.every(ch =>
          weekApproved.some(comp => comp.chore_id === ch.id && comp.completion_date === ds)
        )
        if (kidChores.length > 0 && !allDone) return 0
      }
    }
    return 1 // goal_value is 0 for no_misses, so progressPct uses completed flag instead
  }

  return 0
}

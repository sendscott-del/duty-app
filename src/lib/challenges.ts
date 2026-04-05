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

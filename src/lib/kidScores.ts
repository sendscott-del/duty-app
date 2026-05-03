import { toLocalDateStr } from './utils'

interface Chore {
  id: string
  assigned_to: string | null
  recurrence?: string | null
  recurrence_days?: number[] | null
  due_date?: string | null
}

interface Completion {
  chore_id: string
  completion_date: string
  status: 'submitted' | 'approved' | 'rejected'
}

export interface KidScore {
  weekRate: number      // 0-100, percentage of past-7-day chores approved
  weekDone: number
  weekTotal: number
  streak: number        // consecutive past days with all chores approved
  todayDone: number
  todayTotal: number
}

function isChoreActiveOnDate(chore: Chore, date: Date, dateStr: string, isToday: boolean): boolean {
  if (chore.recurrence === 'daily') return true
  if (chore.recurrence === 'weekly') {
    if (!chore.recurrence_days?.length) return true
    return chore.recurrence_days.includes(date.getDay())
  }
  if (chore.recurrence === 'monthly') return true
  return chore.due_date === dateStr || (!chore.due_date && isToday)
}

export function getKidScore(kidId: string, chores: Chore[], completions: Completion[]): KidScore {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toLocalDateStr(today)

  const compByKey = new Map<string, Completion>()
  for (const c of completions) compByKey.set(`${c.chore_id}|${c.completion_date}`, c)

  const kidChores = chores.filter(c => c.assigned_to === kidId)

  let weekDone = 0
  let weekTotal = 0
  let todayDone = 0
  let todayTotal = 0
  let streak = 0
  let streakAlive = true

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today.getTime() - dayOffset * 86400000)
    const dateStr = toLocalDateStr(date)
    const isThisToday = dateStr === todayStr

    const dayChores = kidChores.filter(c => isChoreActiveOnDate(c, date, dateStr, isThisToday))
    if (dayChores.length === 0) continue

    let approved = 0
    for (const c of dayChores) {
      const comp = compByKey.get(`${c.id}|${dateStr}`)
      if (comp?.status === 'approved') approved++
    }

    if (dayOffset < 7) {
      weekDone += approved
      weekTotal += dayChores.length
    }

    if (isThisToday) {
      todayDone = approved
      todayTotal = dayChores.length
    }

    if (streakAlive) {
      const allDone = approved === dayChores.length
      if (isThisToday) {
        if (allDone) streak++
        // partial today doesn't break streak — still in progress
      } else if (allDone) {
        streak++
      } else {
        streakAlive = false
      }
    }
  }

  return {
    weekRate: weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0,
    weekDone,
    weekTotal,
    streak,
    todayDone,
    todayTotal,
  }
}

import { supabase } from './supabase'
import { useStore, type ChoreCompletion, type Profile } from './store'
import { isChoreActiveOnDate } from './kidScores'
import { toLocalDateStr } from './utils'

/**
 * Chore payout.
 *
 * Default: each chore pays on approval (late ones pay nothing).
 *
 * all_or_nothing kids: nothing pays until every chore assigned to them that day
 * is approved. Then the whole day lands at once, plus completion_bonus. This
 * stops a kid banking points for the easy chores and skipping the hard ones.
 *
 * A late chore still counts toward "the day is done" — it just earns nothing
 * itself, matching the existing late rule. Otherwise one late chore would zero
 * out an otherwise complete day.
 */

/** The chore fields the payout actually reads. */
interface ChoreLike {
  id: string
  assigned_to: string | null
  points: number
  name: string
  family_id: string
  recurrence?: string | null
  recurrence_days?: number[] | null
  due_date?: string | null
}

export interface DayAward {
  /** Point rows to insert — one per non-late chore, plus the bonus. */
  rows: PointRow[]
  choreCount: number
  chorePoints: number
  bonus: number
}

interface PointRow {
  profile_id: string
  family_id: string
  amount: number
  reason: string
  reference_id: string
  reference_type: 'chore' | 'day_bonus'
  award_date?: string
  created_by: string
}

/** The chores assigned to `kidId` that are active on `dateStr`. */
export function choresForKidOnDate(kidId: string, chores: ChoreLike[], dateStr: string): ChoreLike[] {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const isToday = dateStr === toLocalDateStr(new Date())
  return chores.filter(
    (c) => c.assigned_to === kidId && isChoreActiveOnDate(c, date, dateStr, isToday)
  )
}

/**
 * Is every chore assigned to this kid on this day approved?
 * Returns false when the kid has no chores that day — there is nothing to pay.
 */
export function isDayComplete(
  kidId: string,
  dateStr: string,
  chores: ChoreLike[],
  completions: ChoreCompletion[]
): boolean {
  const dayChores = choresForKidOnDate(kidId, chores, dateStr)
  if (dayChores.length === 0) return false
  return dayChores.every((c) =>
    completions.some(
      (comp) =>
        comp.chore_id === c.id &&
        comp.completion_date === dateStr &&
        comp.status === 'approved'
    )
  )
}

/**
 * What a newly-completed day owes. Returns null when the day isn't complete
 * yet, so the caller inserts nothing and the kid banks nothing.
 */
export function buildDayAward(
  kid: Profile,
  dateStr: string,
  chores: ChoreLike[],
  completions: ChoreCompletion[],
  createdBy: string
): DayAward | null {
  if (!isDayComplete(kid.id, dateStr, chores, completions)) return null

  const dayChores = choresForKidOnDate(kid.id, chores, dateStr)
  const rows: PointRow[] = []
  let chorePoints = 0

  for (const chore of dayChores) {
    const comp = completions.find(
      (c) => c.chore_id === chore.id && c.completion_date === dateStr
    )
    // Late chores count toward completing the day but pay nothing themselves.
    if (!comp || comp.completed_late) continue
    rows.push({
      profile_id: kid.id,
      family_id: chore.family_id,
      amount: chore.points,
      reason: `Completed: ${chore.name}`,
      reference_id: comp.id,
      reference_type: 'chore',
      created_by: createdBy,
    })
    chorePoints += chore.points
  }

  const bonus = kid.completion_bonus ?? 0
  if (bonus > 0 && dayChores.length > 0) {
    rows.push({
      profile_id: kid.id,
      family_id: dayChores[0].family_id,
      amount: bonus,
      reason: 'All chores done — completion bonus',
      reference_id: kid.id,
      reference_type: 'day_bonus',
      award_date: dateStr,
      created_by: createdBy,
    })
  }

  return { rows, choreCount: dayChores.length, chorePoints, bonus }
}

/**
 * Insert a day's award and mirror it into the store.
 *
 * Awarding is re-evaluated on every approval, so a complete day can be
 * evaluated more than once. The unique indexes on the table
 * (duty_ptx_unique_chore_ref, duty_ptx_unique_day_bonus) make the repeat a
 * no-op rather than a double payout — hence ignoreDuplicates.
 */
export async function insertDayAward(award: DayAward): Promise<number> {
  if (award.rows.length === 0) return 0
  const { data } = await supabase
    .from('duty_point_transactions')
    .upsert(award.rows, { ignoreDuplicates: true })
    .select()
  const store = useStore.getState()
  for (const row of data ?? []) store.addPointTransaction(row)
  return (data ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0)
}

/**
 * Bring a kid's payout for one day in line with the current completion state.
 *
 * Call this after ANY change to a completion (approve, unapprove, reject,
 * clear) for an all_or_nothing kid. Reads the post-change state from the store,
 * so call it after the store has been updated.
 *
 * - Day now complete   -> insert the day's award (idempotent).
 * - Day now incomplete -> revoke anything already awarded for that day.
 *
 * No-op for kids on the default per-chore scheme.
 */
export async function reconcileDayAward(
  kidId: string,
  dateStr: string,
  createdBy: string
): Promise<number> {
  const { kids, chores, completions } = useStore.getState()
  const kid = kids.find((k) => k.id === kidId)
  if (!kid?.all_or_nothing) return 0

  const award = buildDayAward(kid, dateStr, chores, completions, createdBy)
  if (award) return insertDayAward(award)

  await revokeDayAward(kidId, dateStr, chores, completions)
  return 0
}

/**
 * Undo a day's award — used when a chore is unapproved, rejected or cleared and
 * the day is no longer complete. Removes the day's chore rows and the bonus.
 */
export async function revokeDayAward(
  kidId: string,
  dateStr: string,
  chores: ChoreLike[],
  completions: ChoreCompletion[]
): Promise<void> {
  const dayChores = choresForKidOnDate(kidId, chores, dateStr)
  const completionIds = completions
    .filter(
      (c) =>
        c.completion_date === dateStr && dayChores.some((ch) => ch.id === c.chore_id)
    )
    .map((c) => c.id)

  const store = useStore.getState()

  if (completionIds.length > 0) {
    for (const id of completionIds) store.removePointTransactionsByCompletion(id)
    await supabase
      .from('duty_point_transactions')
      .delete()
      .eq('reference_type', 'chore')
      .in('reference_id', completionIds)
  }

  store.removeDayBonus(kidId, dateStr)
  await supabase
    .from('duty_point_transactions')
    .delete()
    .eq('reference_type', 'day_bonus')
    .eq('profile_id', kidId)
    .eq('award_date', dateStr)
}

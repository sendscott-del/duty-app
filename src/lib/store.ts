import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Challenge } from './challenges'

export interface Profile {
  id: string
  full_name: string
  role: 'parent' | 'kid'
  family_id: string | null
  avatar_color: string
  avatar_url: string | null
  pin: string | null
  /** Kids only: withhold a day's chore points until every chore that day is approved. */
  all_or_nothing?: boolean
  /** Kids only: extra points granted on top when the whole day is done. */
  completion_bonus?: number
}

export interface Family {
  id: string
  name: string
  amazon_tag: string | null
  premium_status: string
  premium_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export interface ChoreCompletion {
  id: string
  chore_id: string
  completed_by: string
  completion_date: string
  status: 'submitted' | 'approved' | 'rejected'
  completed_late: boolean
  approved_at: string | null
  approved_by: string | null
  proof_image_url: string | null
  created_at: string
}

interface Store {
  // Auth/identity (persisted)
  profile: Profile | null
  family: Family | null
  kids: Profile[]
  viewAsKid: Profile | null

  // Cached family data (not persisted — server-truth, fresh per session)
  chores: any[]
  completions: ChoreCompletion[]
  rewards: any[]
  redemptions: any[]
  pointTransactions: any[]
  challenge: Challenge | null

  // True until first data load completes for the current family
  dataLoading: boolean

  // Auth setters
  setProfile: (p: Profile | null) => void
  setFamily: (f: Family | null) => void
  setKids: (kids: Profile[]) => void
  setViewAsKid: (kid: Profile | null) => void
  clear: () => void

  // Data setters
  setDataLoading: (b: boolean) => void
  hydrateFamilyData: (data: {
    chores: any[]
    completions: ChoreCompletion[]
    rewards: any[]
    redemptions: any[]
    pointTransactions: any[]
    challenge: Challenge | null
  }) => void
  clearFamilyData: () => void

  // Granular realtime/optimistic updaters
  upsertChore: (row: any) => void
  removeChore: (id: string) => void
  upsertCompletion: (row: ChoreCompletion) => void
  removeCompletion: (id: string) => void
  upsertReward: (row: any) => void
  removeReward: (id: string) => void
  upsertRedemption: (row: any) => void
  removeRedemption: (id: string) => void
  addPointTransaction: (row: any) => void
  removePointTransactionById: (id: string) => void
  removePointTransactionsByCompletion: (completionId: string) => void
  removeDayBonus: (profileId: string, awardDate: string) => void
  setChallenge: (c: Challenge | null) => void
}

const emptyData = {
  chores: [],
  completions: [],
  rewards: [],
  redemptions: [],
  pointTransactions: [],
  challenge: null,
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      profile: null,
      family: null,
      kids: [],
      viewAsKid: null,
      ...emptyData,
      dataLoading: true,

      setProfile: (profile) => set({ profile }),
      setFamily: (family) => set({ family }),
      setKids: (kids) => set({ kids }),
      setViewAsKid: (viewAsKid) => set({ viewAsKid }),
      clear: () => set({ profile: null, family: null, kids: [], viewAsKid: null, ...emptyData, dataLoading: true }),

      setDataLoading: (dataLoading) => set({ dataLoading }),
      hydrateFamilyData: (data) => set({ ...data, dataLoading: false }),
      clearFamilyData: () => set({ ...emptyData, dataLoading: true }),

      upsertChore: (row) => set((s) => {
        const i = s.chores.findIndex((c) => c.id === row.id)
        if (i === -1) return { chores: [row, ...s.chores] }
        const next = s.chores.slice()
        next[i] = { ...next[i], ...row }
        return { chores: next }
      }),
      removeChore: (id) => set((s) => ({ chores: s.chores.filter((c) => c.id !== id) })),

      upsertCompletion: (row) => set((s) => {
        const i = s.completions.findIndex((c) => c.id === row.id)
        if (i === -1) return { completions: [row, ...s.completions] }
        const next = s.completions.slice()
        next[i] = row
        return { completions: next }
      }),
      removeCompletion: (id) => set((s) => ({ completions: s.completions.filter((c) => c.id !== id) })),

      upsertReward: (row) => set((s) => {
        const i = s.rewards.findIndex((r) => r.id === row.id)
        if (i === -1) return { rewards: [row, ...s.rewards] }
        const next = s.rewards.slice()
        next[i] = { ...next[i], ...row }
        return { rewards: next }
      }),
      removeReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),

      upsertRedemption: (row) => set((s) => {
        const i = s.redemptions.findIndex((r) => r.id === row.id)
        if (i === -1) return { redemptions: [row, ...s.redemptions] }
        const next = s.redemptions.slice()
        next[i] = { ...next[i], ...row }
        return { redemptions: next }
      }),
      removeRedemption: (id) => set((s) => ({ redemptions: s.redemptions.filter((r) => r.id !== id) })),

      addPointTransaction: (row) => set((s) => {
        if (s.pointTransactions.some((t) => t.id === row.id)) return {}
        return { pointTransactions: [row, ...s.pointTransactions] }
      }),
      removePointTransactionById: (id) => set((s) => ({
        pointTransactions: s.pointTransactions.filter((t) => t.id !== id),
      })),
      removePointTransactionsByCompletion: (completionId) => set((s) => ({
        pointTransactions: s.pointTransactions.filter(
          (t) => !(t.reference_id === completionId && t.reference_type === 'chore')
        ),
      })),
      removeDayBonus: (profileId, awardDate) => set((s) => ({
        pointTransactions: s.pointTransactions.filter(
          (t) => !(t.reference_type === 'day_bonus' && t.profile_id === profileId && t.award_date === awardDate)
        ),
      })),

      setChallenge: (challenge) => set({ challenge }),
    }),
    {
      name: 'duty-store',
      // Only persist auth identity — never cache server collections.
      partialize: (s) => ({
        profile: s.profile,
        family: s.family,
        kids: s.kids,
        viewAsKid: s.viewAsKid,
      }),
    }
  )
)

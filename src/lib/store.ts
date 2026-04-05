import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Profile {
  id: string
  full_name: string
  role: 'parent' | 'kid'
  family_id: string | null
  avatar_color: string
  pin: string | null
}

export interface Family {
  id: string
  name: string
  amazon_tag: string | null
}

interface Store {
  profile: Profile | null
  family: Family | null
  kids: Profile[]
  viewAsKid: Profile | null  // parent previewing a kid's view
  setProfile: (p: Profile | null) => void
  setFamily: (f: Family | null) => void
  setKids: (kids: Profile[]) => void
  setViewAsKid: (kid: Profile | null) => void
  clear: () => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      profile: null,
      family: null,
      kids: [],
      viewAsKid: null,
      setProfile: (profile) => set({ profile }),
      setFamily: (family) => set({ family }),
      setKids: (kids) => set({ kids }),
      setViewAsKid: (viewAsKid) => set({ viewAsKid }),
      clear: () => set({ profile: null, family: null, kids: [], viewAsKid: null }),
    }),
    { name: 'duty-store' }
  )
)

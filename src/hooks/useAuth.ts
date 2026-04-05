import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

export function useAuth() {
  const { setProfile, setFamily, setKids, clear } = useStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id)
      else clear()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data: profile } = await supabase
      .from('duty_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) return

    setProfile(profile)

    if (profile.family_id) {
      const { data: family } = await supabase
        .from('duty_families')
        .select('*')
        .eq('id', profile.family_id)
        .single()

      if (family) setFamily(family)

      const { data: kids } = await supabase
        .from('duty_profiles')
        .select('*')
        .eq('family_id', profile.family_id)
        .eq('role', 'kid')

      if (kids) setKids(kids)
    }
  }

  async function signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUp(email: string, password: string, fullName: string) {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })

    // Manually create duty_profiles row (no trigger since we share auth.users with Magnify)
    if (result.data.user && !result.error) {
      await supabase.from('duty_profiles').insert({
        id: result.data.user.id,
        full_name: fullName,
        role: 'parent',
      })
    }

    return result
  }

  async function signOut() {
    clear()
    return supabase.auth.signOut()
  }

  return { signIn, signUp, signOut, loadProfile }
}

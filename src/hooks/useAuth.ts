import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

// Shared ready state so all consumers see the same value
let _ready = false
let _readyListeners: (() => void)[] = []
function setReady() {
  _ready = true
  _readyListeners.forEach(l => l())
  _readyListeners = []
}

export function useAuth() {
  const { setProfile, setFamily, setKids, clear } = useStore()
  const [ready, setReadyState] = useState(_ready)

  useEffect(() => {
    if (!_ready) {
      _readyListeners.push(() => setReadyState(true))
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id).then(setReady)
      } else {
        setReady()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id).then(() => { if (!_ready) setReady() })
      else { clear(); if (!_ready) setReady() }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    let { data: profile } = await supabase
      .from('duty_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // If no duty_profiles row exists, create one (user may exist from Magnify or old Duty)
    if (!profile) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      const { data: newProfile } = await supabase
        .from('duty_profiles')
        .insert({ id: userId, full_name: fullName, role: 'parent' })
        .select()
        .single()

      if (!newProfile) return
      profile = newProfile
    }

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

  return { signIn, signUp, signOut, loadProfile, ready }
}

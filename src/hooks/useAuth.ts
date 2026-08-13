import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../lib/store'

// Where Supabase sends the user back to after they click an emailed link.
// The native iOS/Android shells load the live site through Capacitor's
// `server.url`, so this is the real production origin inside the app too — no
// custom deep-link scheme needed. Every origin used here must be on the shared
// project's redirect allow-list (Auth → URL Configuration); an unlisted URL
// silently falls back to the project Site URL, which points at a different app.
function authRedirect(path: string) {
  return `${window.location.origin}${path}`
}

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
    // Parents: profile id == auth uid. Kids: invisible auth user mapped via
    // auth_user_id (provisioned by the duty-kid-login edge function).
    let { data: profile } = await supabase
      .from('duty_profiles')
      .select('*')
      .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
      .limit(1)
      .maybeSingle()

    // If no duty_profiles row exists, create one (user may exist from Magnify or old Duty)
    if (!profile) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Never auto-create parent profiles for internal kid auth users.
      if (user.email?.endsWith('@kids.duty.internal')) { await supabase.auth.signOut(); return }

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
      // Family + kids don't depend on each other — fetch in parallel.
      const [familyRes, kidsRes] = await Promise.all([
        supabase
          .from('duty_families')
          .select('*')
          .eq('id', profile.family_id)
          .single(),
        supabase
          .from('duty_profiles')
          .select('*')
          .eq('family_id', profile.family_id)
          .eq('role', 'kid'),
      ])

      if (familyRes.data) setFamily(familyRes.data)
      if (kidsRes.data) setKids(kidsRes.data)
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

  // Emails a recovery link. Supabase resolves silently whether or not the
  // address has an account, so callers must show the same message either way —
  // a "no such user" error here would turn this form into an account oracle.
  async function resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirect('/reset-password'),
    })
  }

  // Only valid while a recovery session is active (i.e. on /reset-password
  // after the emailed link established one).
  async function updatePassword(password: string) {
    return supabase.auth.updateUser({ password })
  }

  // A way back in that needs no remembered password. `shouldCreateUser: false`
  // keeps account creation on the sign-up form, so every new parent still gets
  // a duty_profiles row written with their real name.
  async function signInWithMagicLink(email: string) {
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: authRedirect('/'),
        shouldCreateUser: false,
      },
    })
  }

  async function signOut() {
    clear()
    return supabase.auth.signOut()
  }

  return {
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    signInWithMagicLink,
    loadProfile,
    ready,
  }
}

import { isNativeApp } from './platform'
import { supabase } from './supabase'

/**
 * Native push (APNs) registration for the iOS/Android App Store builds.
 *
 * iOS only exposes Web Push to Home-Screen web apps -- never inside the
 * Capacitor WKWebView this build runs in -- so the native shell registers an
 * APNs device token instead. The plugin is imported dynamically so the web
 * bundle never pulls native code.
 */

async function plugin() {
  const { PushNotifications } = await import('@capacitor/push-notifications')
  return PushNotifications
}

/** Ask iOS for permission and register, resolving to the APNs device token. */
function awaitToken(PushNotifications: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => {
      if (!done) { done = true; reject(new Error('Timed out waiting for a device token')) }
    }, 15000)

    PushNotifications.addListener('registration', (t: { value: string }) => {
      if (done) return
      done = true; clearTimeout(timer); resolve(t.value)
    })
    PushNotifications.addListener('registrationError', (e: any) => {
      if (done) return
      done = true; clearTimeout(timer); reject(new Error(String(e?.error ?? 'registration failed')))
    })
    PushNotifications.register()
  })
}

export async function enableNativePush(profileId: string, familyId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isNativeApp) return { ok: false, reason: 'not-native' }
  try {
    const PushNotifications = await plugin()

    let perm = await PushNotifications.checkPermissions()
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions()
    }
    if (perm.receive !== 'granted') {
      return { ok: false, reason: 'denied' }
    }

    const token = await awaitToken(PushNotifications)

    const { error } = await supabase
      .from('duty_push_subscriptions')
      .upsert(
        {
          profile_id: profileId,
          family_id: familyId,
          platform: 'ios',
          device_token: token,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_token' }
      )
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function disableNativePush(): Promise<void> {
  if (!isNativeApp) return
  try {
    const PushNotifications = await plugin()
    // Drop this device's rows, then stop delivery.
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      // device_token isn't known after unregister, so clear by user agent + platform
      await supabase.from('duty_push_subscriptions')
        .delete()
        .eq('platform', 'ios')
        .eq('user_agent', navigator.userAgent)
    }
    await PushNotifications.removeAllListeners()
    await PushNotifications.unregister?.()
  } catch { /* best effort */ }
}

/** True when this build can actually deliver push. */
export const nativePushSupported = isNativeApp

import { useEffect, useRef } from 'react'
import { useStore } from '../lib/store'
import { useCompletions } from './useCompletions'
import { useRewards } from './useRewards'
import { supabase } from '../lib/supabase'

const PREF_KEY = 'duty-notifications'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** Read notification preference from localStorage */
export function getNotifPref(): boolean {
  return localStorage.getItem(PREF_KEY) === 'on'
}

/** Save notification preference */
export function setNotifPref(on: boolean) {
  localStorage.setItem(PREF_KEY, on ? 'on' : 'off')
}

export function getNotifPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/**
 * Subscribe this device to Web Push for the given profile.
 * Registers the SW, asks for permission, subscribes via PushManager,
 * and upserts the subscription row in duty_push_subscriptions.
 */
export async function subscribeToPush(profileId: string, familyId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  if (!VAPID_PUBLIC_KEY) {
    console.error('VITE_VAPID_PUBLIC_KEY is not set; cannot subscribe to push')
    return false
  }

  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  const json = sub.toJSON()
  const { endpoint, keys } = json as { endpoint: string; keys: { p256dh: string; auth: string } }

  const { error } = await supabase
    .from('duty_push_subscriptions')
    .upsert(
      {
        profile_id: profileId,
        family_id: familyId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('Failed to save push subscription:', error)
    return false
  }
  return true
}

/** Unsubscribe this device from Web Push and remove its row. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  await supabase.from('duty_push_subscriptions').delete().eq('endpoint', endpoint)
}

/**
 * Combined toggle helper: enable both the local in-app notif pref AND
 * the server-side Web Push subscription. Returns true on success.
 */
export async function enableNotifications(profileId: string, familyId: string): Promise<boolean> {
  const ok = await subscribeToPush(profileId, familyId)
  if (ok) setNotifPref(true)
  return ok
}

export async function disableNotifications(): Promise<void> {
  setNotifPref(false)
  await unsubscribeFromPush()
}

/** Legacy: kept for backwards-compat with existing UI that just checks permission. */
export async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/sw.js') } catch { /* ignore */ }
  }
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function notify(title: string, body: string) {
  if (!getNotifPref()) return
  // `Notification` doesn't exist inside the native WKWebView -- referencing
  // .permission unguarded throws and takes the watcher effect down with it.
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  // Use service worker registration if available for better mobile support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon: '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        tag: title, // collapse duplicates
      })
    }).catch(() => {
      // Fallback to regular notification
      new Notification(title, { body, icon: '/apple-touch-icon.png' })
    })
  } else {
    new Notification(title, { body, icon: '/apple-touch-icon.png' })
  }
}

/**
 * Watches for realtime changes and fires browser notifications.
 * - Parent: notified when a kid submits a chore or requests a reward
 * - Kid: notified when a chore is approved
 */
export function useNotificationWatcher() {
  const { profile, kids } = useStore()
  const { completions } = useCompletions()
  const { redemptions } = useRewards()

  const prevSubmitted = useRef<number | null>(null)
  const prevPending = useRef<number | null>(null)
  const prevApproved = useRef<number | null>(null)

  const isParent = profile?.role === 'parent'
  const kidMap = useRef<Record<string, string>>({})

  // Keep a name lookup for kid IDs
  useEffect(() => {
    const map: Record<string, string> = {}
    kids.forEach(k => { map[k.id] = k.full_name })
    kidMap.current = map
  }, [kids])

  // Parent notifications: new submitted chores
  const submittedCount = completions.filter(c => c.status === 'submitted').length
  useEffect(() => {
    if (!isParent) return
    if (prevSubmitted.current === null) {
      prevSubmitted.current = submittedCount
      return
    }
    if (submittedCount > prevSubmitted.current) {
      const diff = submittedCount - prevSubmitted.current
      notify(
        'Chore needs approval',
        diff === 1 ? 'A kid finished a chore — tap to review.' : `${diff} chores need your approval.`
      )
    }
    prevSubmitted.current = submittedCount
  }, [submittedCount, isParent])

  // Parent notifications: new reward requests
  const pendingCount = redemptions.filter((r: any) => r.status === 'pending').length
  useEffect(() => {
    if (!isParent) return
    if (prevPending.current === null) {
      prevPending.current = pendingCount
      return
    }
    if (pendingCount > prevPending.current) {
      const diff = pendingCount - prevPending.current
      notify(
        'Reward request',
        diff === 1 ? 'A kid wants to claim a reward.' : `${diff} new reward requests.`
      )
    }
    prevPending.current = pendingCount
  }, [pendingCount, isParent])

  // Kid notifications: chore approved
  const myApprovedCount = completions.filter(
    c => c.status === 'approved' && c.completed_by === profile?.id
  ).length
  useEffect(() => {
    if (isParent) return
    if (prevApproved.current === null) {
      prevApproved.current = myApprovedCount
      return
    }
    if (myApprovedCount > prevApproved.current) {
      notify('Chore approved!', 'Nice work — your parent approved your chore.')
    }
    prevApproved.current = myApprovedCount
  }, [myApprovedCount, isParent, profile?.id])
}

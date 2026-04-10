import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../lib/store'
import { useCompletions } from './useCompletions'
import { useRewards } from './useRewards'

const PREF_KEY = 'duty-notifications'

/** Read notification preference from localStorage */
export function getNotifPref(): boolean {
  return localStorage.getItem(PREF_KEY) === 'on'
}

/** Save notification preference */
export function setNotifPref(on: boolean) {
  localStorage.setItem(PREF_KEY, on ? 'on' : 'off')
}

/** Request permission + register service worker. Returns true if granted. */
export async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false

  // Register SW if not already
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch { /* ignore */ }
  }

  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getNotifPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function notify(title: string, body: string) {
  if (!getNotifPref()) return
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

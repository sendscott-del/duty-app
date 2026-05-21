import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { enableNotifications, getNotifPref, getNotifPermission } from '../../hooks/useNotifications'

const DISMISS_KEY = 'duty-kid-notif-dismissed'

/**
 * Banner shown on the kid's home screen the first time they open the app
 * on a device, asking them to enable chore-reminder pushes for THIS device.
 * Hidden if already subscribed, permission denied, or the kid dismissed it.
 */
export function KidNotifOptIn({ profileId, familyId, isTeen }: { profileId: string; familyId: string; isTeen: boolean }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    if (getNotifPref()) return
    if (getNotifPermission() === 'denied' || getNotifPermission() === 'unsupported') return
    setVisible(true)
  }, [])

  if (!visible) return null

  async function enable() {
    const ok = await enableNotifications(profileId, familyId)
    if (ok) setVisible(false)
    else {
      // permission denied — hide and let them re-enable from a future Settings flow
      localStorage.setItem(DISMISS_KEY, '1')
      setVisible(false)
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      className="flex items-center gap-2 mt-2"
      style={{
        background: isTeen ? '#1a1a1c' : 'var(--yellow)',
        color: isTeen ? '#fff' : 'var(--ink)',
        border: isTeen ? '1.5px solid #333' : '2.5px solid var(--ink)',
        borderRadius: 12,
        padding: '8px 10px',
        boxShadow: isTeen ? 'none' : 'var(--shadow-sm)',
      }}
    >
      <Bell size={14} strokeWidth={3} />
      <div className="flex-1 text-xs font-bold">
        Get a ping when chores are left
      </div>
      <button
        onClick={enable}
        style={{
          background: isTeen ? 'var(--yellow)' : 'var(--ink)',
          color: isTeen ? 'var(--ink)' : 'var(--yellow)',
          border: '2px solid var(--ink)',
          borderRadius: 8,
          padding: '4px 10px',
          fontWeight: 800,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Turn on
      </button>
      <button
        onClick={dismiss}
        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4 }}
        title="Not now"
      >
        <X size={12} strokeWidth={3} />
      </button>
    </div>
  )
}

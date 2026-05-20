import { useEffect, useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useStore } from '../../lib/store'
import { useFamilyData } from '../../hooks/useFamilyData'
import { useNotificationWatcher } from '../../hooks/useNotifications'

export function ParentShell() {
  useFamilyData()
  useNotificationWatcher()

  const completions = useStore((s) => s.completions)
  const redemptions = useStore((s) => s.redemptions)

  const totalBadge = useMemo(
    () =>
      completions.filter((c) => c.status === 'submitted').length +
      redemptions.filter((r: any) => r.status === 'pending').length,
    [completions, redemptions]
  )

  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (totalBadge > 0) navigator.setAppBadge(totalBadge)
      else navigator.clearAppBadge()
    }
  }, [totalBadge])

  return (
    <div className="flex h-[100vh] h-dvh overflow-hidden" style={{ background: 'var(--cream)' }}>
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden safe-top" style={{ background: 'var(--cream)' }} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        <div className="lg:hidden safe-bottom" style={{ background: 'var(--ink)' }}>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { useCompletions } from '../../hooks/useCompletions'
import { useRewards } from '../../hooks/useRewards'
import { useNotificationWatcher } from '../../hooks/useNotifications'

export function ParentShell() {
  const { completions } = useCompletions()
  const { redemptions } = useRewards()

  useNotificationWatcher()

  const totalBadge =
    completions.filter(c => c.status === 'submitted').length +
    redemptions.filter((r: any) => r.status === 'pending').length

  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (totalBadge > 0) {
        navigator.setAppBadge(totalBadge)
      } else {
        navigator.clearAppBadge()
      }
    }
  }, [totalBadge])

  return (
    <div className="flex h-[100vh] h-dvh overflow-hidden" style={{ background: 'var(--p-bg)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden safe-top" style={{ background: 'var(--p-bg)' }} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {/* Bottom nav — mobile only */}
        <div className="lg:hidden safe-bottom" style={{ background: 'var(--p-sidebar)', borderTop: '0.5px solid var(--p-border)' }}>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}

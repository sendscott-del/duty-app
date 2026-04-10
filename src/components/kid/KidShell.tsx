import { Outlet } from 'react-router-dom'
import { useNotificationWatcher } from '../../hooks/useNotifications'

export function KidShell() {
  useNotificationWatcher()

  return (
    <div
      className="min-h-[100vh] min-h-dvh flex flex-col"
      style={{ background: 'linear-gradient(145deg, #1a0e2e, #0d1a2e, #0e2212)' }}
    >
      <div className="safe-top" />
      <Outlet />
    </div>
  )
}

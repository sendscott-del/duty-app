import { Outlet } from 'react-router-dom'
import { useNotificationWatcher } from '../../hooks/useNotifications'
import { useStore } from '../../lib/store'
import { useKidSkin } from '../../hooks/useKidSkin'

export function KidShell() {
  useNotificationWatcher()
  const { profile, viewAsKid } = useStore()
  const active = viewAsKid || profile
  const [skin] = useKidSkin(active?.id)

  const isTeen = skin === 'teen'

  return (
    <div
      className="min-h-[100vh] min-h-dvh flex flex-col"
      style={{
        background: isTeen ? 'var(--ink-dark)' : 'var(--cream)',
        color: isTeen ? '#fff' : 'var(--ink)',
      }}
    >
      <div className="safe-top" />
      <Outlet />
    </div>
  )
}

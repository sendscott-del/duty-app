import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function ParentShell() {
  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--p-bg)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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

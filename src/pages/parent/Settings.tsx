import { useStore } from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { LogOut } from 'lucide-react'

export function Settings() {
  const { family, kids } = useStore()
  const { signOut } = useAuth()

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <h1 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--p-text)' }}>Settings</h1>

      {/* Family */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--p-dim)' }}>Family</div>
        <div className="text-lg font-medium" style={{ color: 'var(--p-text)' }}>{family?.name}</div>
      </div>

      {/* Kids */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--p-dim)' }}>Kids</div>
        <div className="space-y-3">
          {kids.map(kid => (
            <div key={kid.id} className="flex items-center gap-3">
              <Avatar name={kid.full_name} color={kid.avatar_color} />
              <div className="text-sm" style={{ color: 'var(--p-text)' }}>{kid.full_name}</div>
            </div>
          ))}
          {kids.length === 0 && (
            <div className="text-sm" style={{ color: 'var(--p-muted)' }}>No kids added yet.</div>
          )}
        </div>
      </div>

      {/* Amazon */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--p-dim)' }}>Amazon Associates</div>
        <div className="text-sm mb-2" style={{ color: 'var(--p-text)' }}>
          Tag: {family?.amazon_tag || 'Not set'}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--p-dim)' }}>
          As an Amazon Associate, Duty earns from qualifying purchases.
        </p>
      </div>

      <Button variant="red" fullWidth onClick={signOut}>
        <LogOut size={16} /> Sign Out
      </Button>
    </div>
  )
}

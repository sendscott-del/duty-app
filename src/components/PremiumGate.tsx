import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PremiumGateProps {
  isPremium: boolean
  children: React.ReactNode
  lockedContent?: React.ReactNode
}

export function PremiumGate({ isPremium, children, lockedContent }: PremiumGateProps) {
  if (isPremium) return <>{children}</>
  if (lockedContent) return <>{lockedContent}</>
  return null
}

export function PremiumBadge({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        background: 'var(--yellow)', color: 'var(--ink)',
        border: '2px solid var(--ink)', borderRadius: 999,
        padding: '1px 7px', fontSize: 10, fontWeight: 800,
        fontFamily: 'var(--font-mono)', cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Lock size={8} strokeWidth={3} /> PREMIUM
    </button>
  )
}

export function LockedCard({ title, description }: { title: string; description: string }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/parent/upgrade')}
      style={{
        background: 'var(--ink)',
        border: '3px solid var(--ink)',
        borderRadius: 16,
        padding: 14,
        boxShadow: 'var(--shadow)',
        cursor: 'pointer',
        opacity: 0.85,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="stadium-eyebrow" style={{ color: 'var(--yellow)', opacity: 0.85 }}>PREMIUM FEATURE</span>
        <PremiumBadge />
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--yellow)' }}>
        {title}
      </div>
      <div className="text-xs font-bold mt-1" style={{ color: 'rgba(255,247,230,0.7)' }}>
        {description}
      </div>
      <div
        className="mt-3 text-xs font-bold"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'var(--yellow)', color: 'var(--ink)',
          border: '2px solid var(--ink)', borderRadius: 10,
          padding: '6px 12px', boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Lock size={11} strokeWidth={3} /> Unlock with Premium
      </div>
    </div>
  )
}

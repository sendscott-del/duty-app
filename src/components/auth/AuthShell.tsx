import { SirFlush } from '../ui/SirFlush'

// Shared frame for the account-recovery pages, matching the Login screen's
// masthead so the emailed links don't drop people onto a stranger-looking page.
export function AuthShell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div style={{ display: 'inline-block', transform: 'rotate(-6deg)', filter: 'drop-shadow(var(--shadow))' }}>
            <SirFlush size={92} expression="wink" />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 64,
              color: 'var(--ink)',
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
              textShadow: '5px 5px 0 var(--yellow)',
              marginTop: 8,
            }}
          >
            DUTY
          </div>
          <p className="font-bold mt-2" style={{ color: 'var(--ink-50)' }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

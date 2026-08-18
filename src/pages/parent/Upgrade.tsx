import { useEffect, useState } from 'react'
import { Check, Sparkles, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { SirFlush } from '../../components/ui/SirFlush'
import { usePremium } from '../../hooks/usePremium'
import { useStore } from '../../lib/store'
import { isNativeApp } from '../../lib/platform'
import {
  getPremiumPackages, initPurchases, purchasePremium, restorePremium,
  type PremiumPackage,
} from '../../lib/revenuecat'

const FEATURES = [
  { label: 'Weekly family challenges with bonus points' },
  { label: 'Require photo proof on chores' },
  { label: 'Full point history' },
  { label: 'Everything that comes next' },
]

export function Upgrade() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState(false)
  const { isPremium } = usePremium()
  const family = useStore((s) => s.family)

  // Native in-app purchase state. `iapPackages` stays empty on web, and also on any
  // App Store build that predates the RevenueCat plugin — see lib/revenuecat.ts for
  // why that case has to degrade rather than throw.
  const [iapPackages, setIapPackages] = useState<PremiumPackage[]>([])
  const [iapChecked, setIapChecked] = useState(false)
  const [iapError, setIapError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!isNativeApp || !family?.id) { setIapChecked(true); return }
    ;(async () => {
      const ready = await initPurchases(family.id)
      const pkgs = ready ? await getPremiumPackages() : []
      if (!cancelled) { setIapPackages(pkgs); setIapChecked(true) }
    })()
    return () => { cancelled = true }
  }, [family?.id])

  async function handleNativePurchase(pkg: PremiumPackage) {
    setLoading(true); setIapError('')
    try {
      const res = await purchasePremium(pkg)
      if (res.status === 'error') { setIapError(res.message); return }
      if (res.status === 'cancelled') return
      // Premium columns are server-truth, written by the RevenueCat webhook, so
      // reload rather than optimistically flipping anything client-side.
      window.location.reload()
    } finally { setLoading(false) }
  }

  async function handleRestore() {
    setLoading(true); setIapError('')
    try {
      const res = await restorePremium()
      if (res.status === 'success') window.location.reload()
      else if (res.status === 'error') setIapError(res.message)
    } finally { setLoading(false) }
  }

  async function handleUpgrade() {
    if (!family) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan, family_id: family.id },
      })
      if (error || !data?.url) {
        alert('Could not start checkout. Please try again.')
        return
      }
      window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 lg:p-8 max-w-md">
      <Link
        to="/parent/settings"
        className="inline-flex items-center gap-1 mb-5 font-bold text-sm"
        style={{ color: 'var(--ink-50)' }}
      >
        <ArrowLeft size={14} strokeWidth={3} /> Back
      </Link>

      <div className="stadium-eyebrow">UPGRADE</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 6 }}>
        Go Premium
      </h1>
      <p className="text-sm font-bold mb-6" style={{ color: 'var(--ink-50)' }}>
        Everything your family needs to stay motivated.
      </p>

      {isPremium ? (
        <div
          style={{
            background: 'var(--green)', color: '#fff',
            border: '3px solid var(--ink)', borderRadius: 16,
            padding: 18, boxShadow: 'var(--shadow)', marginBottom: 24,
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={20} strokeWidth={3} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '-0.03em' }}>
              You're on Premium
            </span>
          </div>
          <p className="text-sm font-bold mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {family?.premium_period_end
              ? `Active until ${new Date(family.premium_period_end).toLocaleDateString()}`
              : 'All features unlocked.'}
          </p>
        </div>
      ) : isNativeApp && iapPackages.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          {iapPackages
            .slice()
            .sort((a) => (a.period === 'annual' ? -1 : 1))
            .map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleNativePurchase(pkg)}
                disabled={loading}
                style={{
                  width: '100%', background: pkg.period === 'annual' ? 'var(--yellow)' : '#fff',
                  color: 'var(--ink)', border: '2.5px solid var(--ink)', borderRadius: 14,
                  padding: '16px 18px', marginBottom: 12, boxShadow: 'var(--shadow-sm)',
                  fontWeight: 800, fontSize: 16, cursor: loading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>{pkg.period === 'annual' ? 'Yearly' : 'Monthly'}</span>
                {/* Store-formatted price: correct currency and locale for the buyer. */}
                <span>{pkg.priceString}</span>
              </button>
            ))}
          <button
            onClick={handleRestore}
            disabled={loading}
            style={{
              width: '100%', background: 'transparent', border: 'none', padding: '6px 0',
              color: 'var(--ink-50)', fontWeight: 800, fontSize: 13,
              textDecoration: 'underline', cursor: 'pointer',
            }}
          >
            Restore purchases
          </button>
          {iapError && (
            <div className="text-sm font-bold mt-2" style={{ color: 'var(--red, #c0392b)' }}>{iapError}</div>
          )}
        </div>
      ) : isNativeApp ? (
        <div
          style={{
            background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 16,
            padding: 18, boxShadow: 'var(--shadow-sm)', marginBottom: 24,
          }}
        >
          <div className="stadium-eyebrow mb-2">PREMIUM</div>
          <div className="font-bold text-sm" style={{ color: 'var(--ink-50)' }}>
            {iapChecked
              ? // Reached on App Store builds without the RevenueCat plugin. Keep the
                // pre-IAP wording: on those builds there is genuinely no purchase path.
                "Duty works great on the free plan — unlimited kids, chores, approvals, rewards, 30-day history, and push notifications are all included. Optional extra features are managed on the Duty website."
              : 'Loading…'}
          </div>
        </div>
      ) : (
        <>
          {/* Plan toggle */}
          <div
            className="flex mb-6"
            style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 12, padding: 4, boxShadow: 'var(--shadow-sm)' }}
          >
            {(['monthly', 'annual'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className="flex-1 relative"
                style={{
                  background: plan === p ? 'var(--ink)' : 'transparent',
                  color: plan === p ? '#fff' : 'var(--ink)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 8px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'background 160ms',
                }}
              >
                {p === 'monthly' ? 'Monthly' : (
                  <span>
                    Annual{' '}
                    <span style={{ background: 'var(--yellow)', color: 'var(--ink)', borderRadius: 999, padding: '1px 5px', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 800, marginLeft: 3 }}>
                      SAVE 44%
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Price display */}
          <div
            style={{
              background: 'var(--ink)', color: 'var(--yellow)',
              border: '3px solid var(--ink)', borderRadius: 16,
              padding: 18, boxShadow: 'var(--shadow)', marginBottom: 20,
              backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,210,63,0.05) 12px 14px)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {plan === 'monthly' ? '$2.99' : '$1.66'}
              <span className="text-base font-bold" style={{ color: 'rgba(255,247,230,0.6)', fontFamily: 'inherit' }}>
                /mo
              </span>
            </div>
            {plan === 'annual' && (
              <div className="text-xs font-bold mt-1" style={{ color: 'rgba(255,247,230,0.7)' }}>
                Billed $19.99/year
              </div>
            )}
          </div>

          {/* Feature list */}
          <div
            style={{ background: '#fff', border: '2.5px solid var(--ink)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}
          >
            <div className="stadium-eyebrow mb-3">WHAT YOU GET</div>
            <div className="space-y-3">
              {FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} color="#fff" />
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Free tier reminder */}
          <div
            style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 14, padding: 14, boxShadow: 'var(--shadow-sm)', marginBottom: 20 }}
          >
            <div className="stadium-eyebrow mb-2" style={{ color: 'var(--ink-50)' }}>ALWAYS FREE</div>
            <div className="text-sm font-bold" style={{ color: 'var(--ink-50)' }}>
              Unlimited kids · Unlimited chores · Approvals · Rewards · 30-day history · Push notifications
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              width: '100%', background: 'var(--yellow)', color: 'var(--ink)',
              border: '3px solid var(--ink)', borderRadius: 14,
              padding: '14px 20px', fontWeight: 800, fontSize: 16,
              boxShadow: 'var(--shadow)', cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.02em',
            }}
          >
            {loading ? 'Loading…' : plan === 'monthly' ? 'Upgrade for $2.99/mo' : 'Upgrade for $19.99/yr'}
          </button>
          <p className="text-center text-xs font-bold mt-3" style={{ color: 'var(--ink-50)' }}>
            Cancel any time. No hidden fees.
          </p>
        </>
      )}

      <div className="flex justify-center mt-8">
        <SirFlush size={80} expression="cheer" />
      </div>
    </div>
  )
}

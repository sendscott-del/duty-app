import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../lib/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SirFlush } from '../../components/ui/SirFlush'

// Duty-only demo account — parent of an isolated "Demo Family" with fictional
// kids/chores/rewards, zero real data. It has NO profile in any other app on the
// shared Supabase project, so this public credential cannot reach church/Magnify
// data. Do NOT reuse a cross-app Apple-review login here.
const DEMO_EMAIL = 'demo@dutychores.app'
const DEMO_PASSWORD = 'DutyDemo!2026'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  // Set when the failure is one that recovery actually solves — a wrong
  // password, or a sign-up blocked because the account already exists. Both
  // used to be dead ends with no route forward.
  const [showRecovery, setShowRecovery] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const { signIn, signUp, loadProfile } = useAuth()
  const { profile } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      if (!profile.family_id) navigate('/setup')
      else navigate(profile.role === 'parent' ? '/parent/overview' : '/kid')
    }
  }, [profile, navigate])

  async function tryDemo() {
    setError('')
    setDemoLoading(true)
    const { error, data } = await signIn(DEMO_EMAIL, DEMO_PASSWORD)
    if (error) { setError("Couldn't start the demo. Please try again."); setDemoLoading(false); return }
    if (data.user) await loadProfile(data.user.id)
    setDemoLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setShowRecovery(false)
    setLoading(true)
    if (isSignUp) {
      const { error, data } = await signUp(email, password, fullName)
      if (error) {
        const exists = /already (registered|exists)/i.test(error.message)
        setError(exists ? 'An account already exists for that email.' : error.message)
        setShowRecovery(exists)
        setLoading(false)
        return
      }
      if (data.user) await loadProfile(data.user.id)
    } else {
      const { error, data } = await signIn(email, password)
      if (error) {
        setError(error.message)
        setShowRecovery(/invalid login credentials/i.test(error.message))
        setLoading(false)
        return
      }
      if (data.user) await loadProfile(data.user.id)
    }
    setLoading(false)
  }

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
          <p className="font-bold mt-2" style={{ color: 'var(--ink-50)' }}>Do your duty. Earn your rewards.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          style={{
            background: '#fff',
            border: '3px solid var(--ink)',
            borderRadius: 18,
            padding: 18,
            boxShadow: 'var(--shadow)',
          }}
        >
          {isSignUp && (
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required />
          )}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />

          {error && (
            <div
              style={{
                background: 'var(--red)',
                color: '#fff',
                border: '2.5px solid var(--ink)',
                borderRadius: 8,
                padding: '8px 12px',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {error}
              {showRecovery && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ display: 'block', marginTop: 6, color: '#fff', fontWeight: 800, textDecoration: 'underline' }}
                >
                  Reset your password →
                </button>
              )}
            </div>
          )}

          {!isSignUp && (
            <div className="text-right" style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{ color: 'var(--red)', fontWeight: 800, fontSize: 13 }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </Button>

          <Button type="button" variant="outline" fullWidth loading={demoLoading} onClick={tryDemo}>
            TRY THE DEMO
          </Button>
          <p className="text-center text-xs font-bold" style={{ color: 'var(--ink-50)', marginTop: -4 }}>
            Explore a sample family — no sign-in needed
          </p>
        </form>

        <p className="text-center text-sm font-bold mt-5" style={{ color: 'var(--ink-50)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }} style={{ color: 'var(--red)', fontWeight: 800 }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <div className="text-center mt-3">
          <button onClick={() => navigate('/kid-login')} className="stadium-eyebrow" style={{ cursor: 'pointer' }}>
            KID LOGIN →
          </button>
        </div>
      </div>
    </div>
  )
}

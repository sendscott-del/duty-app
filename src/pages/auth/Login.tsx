import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../lib/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SirFlush } from '../../components/ui/SirFlush'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, loadProfile } = useAuth()
  const { profile } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (profile) {
      if (!profile.family_id) navigate('/setup')
      else navigate(profile.role === 'parent' ? '/parent/overview' : '/kid')
    }
  }, [profile, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (isSignUp) {
      const { error, data } = await signUp(email, password, fullName)
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user) await loadProfile(data.user.id)
    } else {
      const { error, data } = await signIn(email, password)
      if (error) { setError(error.message); setLoading(false); return }
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
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </Button>
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

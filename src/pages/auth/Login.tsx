import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../lib/store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

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

  // Redirect once profile loads in the store
  useEffect(() => {
    if (profile) {
      if (!profile.family_id) {
        navigate('/setup')
      } else {
        navigate(profile.role === 'parent' ? '/parent/overview' : '/kid')
      }
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
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'var(--p-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Duty" className="w-20 h-20 rounded-2xl mx-auto mb-3" />
          <div className="font-display text-3xl font-extrabold" style={{ color: 'var(--gold)' }}>Duty</div>
          <p className="text-sm mt-1" style={{ color: 'var(--p-muted)' }}>Do your duty. Earn your rewards.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required />
          )}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />

          {error && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--p-muted)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }} style={{ color: 'var(--gold)' }} className="font-medium">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <div className="text-center mt-4">
          <button onClick={() => navigate('/kid-login')} className="text-xs" style={{ color: 'var(--p-dim)' }}>
            Kid login →
          </button>
        </div>
      </div>
    </div>
  )
}

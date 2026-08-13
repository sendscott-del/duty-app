import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthShell } from '../../components/auth/AuthShell'
import { authCardStyle, authErrorStyle } from '../../components/auth/authStyles'

type Mode = 'reset' | 'magic'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<Mode>('reset')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { resetPassword, signInWithMagicLink } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = mode === 'reset'
      ? await resetPassword(email)
      : await signInWithMagicLink(email)

    setLoading(false)

    // Rate limiting is the one failure worth surfacing — it's actionable, and
    // it doesn't reveal whether the address has an account. Everything else
    // (including the "user not found" that the magic-link path does report)
    // collapses into the same neutral confirmation, so this form can't be used
    // to test which emails are registered.
    if (error && error.status === 429) {
      setError('Too many requests. Wait a minute, then try again.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell subtitle="Let's get you back in.">
        <div style={authCardStyle}>
          <p className="font-bold" style={{ color: 'var(--ink)' }}>Check your email.</p>
          <p className="text-sm font-bold mt-2" style={{ color: 'var(--ink-50)' }}>
            If an account exists for <strong>{email}</strong>, we sent a{' '}
            {mode === 'reset' ? 'link to set a new password' : 'link that signs you in'}.
            It expires shortly, so use it soon. Check spam if it hasn't arrived in a
            minute — it comes from Left Field Labs.
          </p>

          <div className="mt-4 space-y-3">
            <Button type="button" fullWidth onClick={() => navigate('/login')}>
              BACK TO SIGN IN
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => { setSent(false); setError('') }}
            >
              USE A DIFFERENT EMAIL
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell subtitle="Let's get you back in.">
      <form onSubmit={handleSubmit} className="space-y-4" style={authCardStyle}>
        <p className="text-sm font-bold" style={{ color: 'var(--ink-50)' }}>
          {mode === 'reset'
            ? "Enter your email and we'll send a link to set a new password."
            : "Enter your email and we'll send a link that signs you straight in — no password needed."}
        </p>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        {error && <div style={authErrorStyle}>{error}</div>}

        <Button type="submit" fullWidth loading={loading}>
          {mode === 'reset' ? 'SEND RESET LINK' : 'SEND LOGIN LINK'}
        </Button>

        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => { setMode(mode === 'reset' ? 'magic' : 'reset'); setError('') }}
        >
          {mode === 'reset' ? 'EMAIL ME A LOGIN LINK INSTEAD' : 'RESET MY PASSWORD INSTEAD'}
        </Button>
      </form>

      <p className="text-center text-sm font-bold mt-5" style={{ color: 'var(--ink-50)' }}>
        Remembered it?{' '}
        <button onClick={() => navigate('/login')} style={{ color: 'var(--red)', fontWeight: 800 }}>
          Sign In
        </button>
      </p>
    </AuthShell>
  )
}

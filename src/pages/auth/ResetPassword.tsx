import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AuthShell } from '../../components/auth/AuthShell'
import { authCardStyle, authErrorStyle } from '../../components/auth/authStyles'

const MIN_LENGTH = 6

type Status = 'checking' | 'ready' | 'invalid' | 'done'

export function ResetPassword() {
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [linkError, setLinkError] = useState('')
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    // A recovery link can arrive in either shape depending on the project's
    // auth flow: implicit puts tokens in the URL hash (the Supabase client
    // consumes those itself via detectSessionInUrl), PKCE puts a ?code= in the
    // query that has to be exchanged by hand. Handle both so this page keeps
    // working if the shared project's flow type is ever switched.
    async function init() {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const query = new URLSearchParams(window.location.search)

      const description = hash.get('error_description') || query.get('error_description')
      if (description) {
        if (cancelled) return
        setLinkError(
          hash.get('error_code') === 'otp_expired' || query.get('error_code') === 'otp_expired'
            ? 'That link has expired. Reset links are single-use and short-lived.'
            : description,
        )
        setStatus('invalid')
        return
      }

      const code = query.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error && !cancelled) {
          setLinkError('That link is no longer valid. Request a fresh one.')
          setStatus('invalid')
          return
        }
      }

      // getSession() waits on the client's own URL-parsing step, so by here an
      // implicit-flow link has already been turned into a session.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setStatus(session ? 'ready' : 'invalid')
    }

    init()

    // Belt and braces: if the client finishes parsing the URL after init() has
    // looked, this still flips the page into its usable state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        setStatus(current => (current === 'invalid' || current === 'checking' ? 'ready' : current))
      }
    })

    return () => { cancelled = true; subscription.unsubscribe() }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Those two passwords don't match.")
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)

    if (error) { setError(error.message); return }
    setStatus('done')
  }

  if (status === 'checking') {
    return (
      <AuthShell subtitle="Checking your link…">
        <div style={authCardStyle}>
          <p className="text-sm font-bold" style={{ color: 'var(--ink-50)' }}>One moment.</p>
        </div>
      </AuthShell>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthShell subtitle="That link didn't work.">
        <div style={authCardStyle}>
          <p className="text-sm font-bold" style={{ color: 'var(--ink-50)' }}>
            {linkError || 'This reset link is invalid or has already been used.'}
          </p>
          <div className="mt-4 space-y-3">
            <Button type="button" fullWidth onClick={() => navigate('/forgot-password')}>
              SEND A NEW LINK
            </Button>
            <Button type="button" variant="outline" fullWidth onClick={() => navigate('/login')}>
              BACK TO SIGN IN
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  if (status === 'done') {
    return (
      <AuthShell subtitle="All set.">
        <div style={authCardStyle}>
          <p className="font-bold" style={{ color: 'var(--ink)' }}>Password updated.</p>
          <p className="text-sm font-bold mt-2" style={{ color: 'var(--ink-50)' }}>
            You're signed in on this device. Use your new password next time.
          </p>
          <div className="mt-4">
            <Button type="button" fullWidth onClick={() => navigate('/', { replace: true })}>
              CONTINUE TO DUTY
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell subtitle="Choose a new password.">
      <form onSubmit={handleSubmit} className="space-y-4" style={authCardStyle}>
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={`At least ${MIN_LENGTH} characters`}
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Type it again"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          required
        />

        {error && <div style={authErrorStyle}>{error}</div>}

        <Button type="submit" fullWidth loading={loading}>
          SAVE NEW PASSWORD
        </Button>
      </form>
    </AuthShell>
  )
}

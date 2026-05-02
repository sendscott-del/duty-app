import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useStore, type Profile } from '../../lib/store'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '../../components/ui/Avatar'
import { SirFlush } from '../../components/ui/SirFlush'
import { PinPad } from '../../components/ui/PinPad'

export function KidPin() {
  const [kids, setKids] = useState<Profile[]>([])
  const [familyName, setFamilyName] = useState('')
  const [selected, setSelected] = useState<Profile | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [noFamily, setNoFamily] = useState(false)
  const { setProfile, setFamily } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { family: storedFamily } = useStore()
  const familyId = searchParams.get('f') || storedFamily?.id

  useEffect(() => {
    if (!familyId) { setNoFamily(true); return }
    supabase.from('duty_families').select('name').eq('id', familyId).single().then(({ data }) => {
      if (data) setFamilyName(data.name)
    })
    supabase.from('duty_profiles').select('*').eq('role', 'kid').eq('family_id', familyId).then(({ data }) => {
      if (data) {
        const unique = Array.from(new Map(data.map((k: any) => [k.id, k])).values())
        setKids(unique as Profile[])
      }
    })
  }, [familyId])

  // Watch PIN length and validate when complete
  useEffect(() => {
    if (!selected || pin.length !== 4) return
    if (pin === selected.pin) {
      setProfile(selected)
      if (selected.family_id) {
        supabase.from('duty_families').select('*').eq('id', selected.family_id).single().then(({ data }) => {
          if (data) setFamily(data)
        })
      }
      navigate('/kid')
    } else {
      setError('Wrong PIN')
      setTimeout(() => { setPin(''); setError('') }, 700)
    }
  }, [pin, selected, navigate, setFamily, setProfile])

  if (noFamily) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream)' }}>
        <SirFlush size={120} expression="sleepy" />
        <p className="text-base font-bold text-center mt-4 mb-6" style={{ color: 'var(--ink)' }}>
          Ask your parent for the kid login link.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'var(--ink)', color: 'var(--yellow)',
            border: '3px solid var(--ink)', borderRadius: 12,
            padding: '10px 18px', fontFamily: 'var(--font-display)', fontSize: 16,
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          }}
        >
          Parent login →
        </button>
      </div>
    )
  }

  // Pick a kid
  if (!selected) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'var(--cream)' }}>
        <div style={{ transform: 'rotate(-6deg)', filter: 'drop-shadow(var(--shadow))', marginBottom: 6 }}>
          <SirFlush size={88} expression="wink" />
        </div>
        {familyName && (
          <div className="stadium-eyebrow" style={{ marginBottom: 4 }}>{familyName}</div>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38,
            letterSpacing: '-0.04em',
            color: 'var(--ink)',
            textShadow: '4px 4px 0 var(--yellow)',
            marginBottom: 18,
          }}
        >
          WHO ARE YOU?
        </h1>

        <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
          {kids.map(kid => (
            <button
              key={kid.id}
              onClick={() => setSelected(kid)}
              className="flex flex-col items-center gap-3 transition-transform active:scale-95"
              style={{
                background: '#fff',
                border: '3px solid var(--ink)',
                borderRadius: 18,
                padding: 18,
                boxShadow: 'var(--shadow)',
                cursor: 'pointer',
              }}
            >
              <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="xl" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                {kid.full_name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>

        {kids.length === 0 && (
          <p className="text-sm mt-6" style={{ color: 'var(--ink-50)' }}>No kids found.</p>
        )}

        <button onClick={() => navigate('/login')} className="mt-10 stadium-eyebrow" style={{ cursor: 'pointer' }}>
          PARENT LOGIN →
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--blue)', color: 'var(--cream)' }}
    >
      <button
        onClick={() => { setSelected(null); setPin(''); setError('') }}
        className="absolute top-6 left-6 flex items-center gap-1 text-sm font-bold"
        style={{ color: 'var(--cream)' }}
      >
        <ArrowLeft size={16} strokeWidth={3} /> Back
      </button>

      <div style={{ transform: 'rotate(-4deg)' }}>
        <SirFlush size={88} expression="wink" />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          letterSpacing: '-0.03em',
          marginTop: 12,
          textShadow: '3px 3px 0 var(--ink)',
        }}
      >
        HEY {selected.full_name.split(' ')[0].toUpperCase()}!
      </div>
      <p className="font-bold mt-1 mb-6">Enter your secret code</p>

      <PinPad value={pin} onChange={setPin} error={!!error} light />

      {error && (
        <p className="font-bold mt-4" style={{ color: 'var(--yellow)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
          {error}
        </p>
      )}
    </div>
  )
}

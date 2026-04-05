import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useStore, type Profile } from '../../lib/store'
import { AVATAR_COLORS, getInitials } from '../../lib/utils'
import { ArrowLeft, Delete } from 'lucide-react'

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

  // Get family ID from URL param or from store
  const { family: storedFamily } = useStore()
  const familyId = searchParams.get('f') || storedFamily?.id

  useEffect(() => {
    if (!familyId) {
      setNoFamily(true)
      return
    }

    // Fetch family name
    supabase.from('duty_families').select('name').eq('id', familyId).single().then(({ data }) => {
      if (data) setFamilyName(data.name)
    })

    // Fetch kids for this family only, deduplicated by id
    supabase.from('duty_profiles').select('*').eq('role', 'kid').eq('family_id', familyId).then(({ data }) => {
      if (data) {
        // Deduplicate by id
        const unique = Array.from(new Map(data.map((k: any) => [k.id, k])).values())
        setKids(unique as Profile[])
      }
    })
  }, [familyId])

  function handleDigit(d: string) {
    if (pin.length >= 4) return
    const newPin = pin + d
    setPin(newPin)
    setError('')

    if (newPin.length === 4 && selected) {
      if (newPin === selected.pin) {
        setProfile(selected)
        if (selected.family_id) {
          supabase.from('duty_families').select('*').eq('id', selected.family_id).single().then(({ data }) => {
            if (data) setFamily(data)
          })
        }
        navigate('/kid')
      } else {
        setError('Wrong PIN')
        setPin('')
      }
    }
  }

  if (noFamily) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(145deg, #1a0e2e, #0d1a2e, #0e2212)' }}>
        <img src="/logo.png" alt="Duty" className="w-16 h-16 rounded-2xl mb-3" />
        <p className="text-sm text-center mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Ask your parent for the kid login link.
        </p>
        <button onClick={() => navigate('/login')} className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
          Parent login →
        </button>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(145deg, #1a0e2e, #0d1a2e, #0e2212)' }}>
        <img src="/logo.png" alt="Duty" className="w-16 h-16 rounded-2xl mb-2" />
        {familyName && <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{familyName}</p>}
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Who are you?</p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-[300px]">
          {kids.map(kid => {
            const c = AVATAR_COLORS[kid.avatar_color] ?? AVATAR_COLORS.purple
            return (
              <button
                key={kid.id}
                onClick={() => setSelected(kid)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: c.bg, color: c.text }}>
                  {getInitials(kid.full_name)}
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{kid.full_name}</span>
              </button>
            )
          })}
        </div>

        {kids.length === 0 && (
          <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>No kids found.</p>
        )}

        <button onClick={() => navigate('/login')} className="mt-10 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Parent login →
        </button>
      </div>
    )
  }

  const c = AVATAR_COLORS[selected.avatar_color] ?? AVATAR_COLORS.purple

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ background: 'linear-gradient(145deg, #1a0e2e, #0d1a2e, #0e2212)' }}>
      <button onClick={() => { setSelected(null); setPin(''); setError('') }} className="flex items-center gap-1 text-sm mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold mb-4" style={{ background: c.bg, color: c.text }}>
        {getInitials(selected.full_name)}
      </div>
      <div className="text-xl font-display font-bold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{selected.full_name}</div>
      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Enter your PIN</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pin.length ? 'bg-[var(--gold)] scale-110' : 'bg-white/20'}`} />
        ))}
      </div>

      {error && <p className="text-sm mb-4 font-medium" style={{ color: 'var(--red)' }}>{error}</p>}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map(key => (
          <button
            key={key || 'empty'}
            onClick={() => key === 'del' ? setPin(pin.slice(0, -1)) : key && handleDigit(key)}
            disabled={!key}
            className="h-16 rounded-2xl text-xl font-medium transition-all active:scale-95 disabled:invisible"
            style={{
              background: key === 'del' ? 'transparent' : 'rgba(255,255,255,0.06)',
              color: key === 'del' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
            }}
          >
            {key === 'del' ? <Delete size={22} className="mx-auto" /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}

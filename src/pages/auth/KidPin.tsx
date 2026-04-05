import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useStore, type Profile } from '../../lib/store'
import { AVATAR_COLORS, getInitials } from '../../lib/utils'
import { ArrowLeft, Delete } from 'lucide-react'

export function KidPin() {
  const [kids, setKids] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const { setProfile, setFamily } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('duty_profiles').select('*').eq('role', 'kid').then(({ data }) => {
      if (data) setKids(data as Profile[])
    })
  }, [])

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

  if (!selected) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5" style={{ background: 'linear-gradient(145deg, #1a0e2e, #0d1a2e, #0e2212)' }}>
        <div className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--gold)' }}>💩 Duty</div>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Who are you?</p>

        <div className="grid grid-cols-2 gap-4 max-w-xs w-full">
          {kids.map(kid => {
            const c = AVATAR_COLORS[kid.avatar_color] ?? AVATAR_COLORS.purple
            return (
              <button
                key={kid.id}
                onClick={() => setSelected(kid)}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium" style={{ background: c.bg, color: c.text }}>
                  {getInitials(kid.full_name)}
                </div>
                <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{kid.full_name}</span>
              </button>
            )
          })}
        </div>

        <button onClick={() => navigate('/login')} className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Parent login →
        </button>
      </div>
    )
  }

  const c = AVATAR_COLORS[selected.avatar_color] ?? AVATAR_COLORS.purple

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5" style={{ background: 'linear-gradient(145deg, #1a0e2e, #0d1a2e, #0e2212)' }}>
      <button onClick={() => { setSelected(null); setPin(''); setError('') }} className="flex items-center gap-1 text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium mb-3" style={{ background: c.bg, color: c.text }}>
        {getInitials(selected.full_name)}
      </div>
      <div className="text-lg font-display font-bold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{selected.full_name}</div>
      <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Enter your PIN</p>

      <div className="flex gap-3 mb-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-3.5 h-3.5 rounded-full ${i < pin.length ? 'bg-[var(--gold)]' : 'bg-white/20'}`} />
        ))}
      </div>

      {error && <p className="text-sm mb-4" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="grid grid-cols-3 gap-3 max-w-[240px]">
        {['1','2','3','4','5','6','7','8','9','','0','del'].map(key => (
          <button
            key={key || 'empty'}
            onClick={() => key === 'del' ? setPin(pin.slice(0, -1)) : key && handleDigit(key)}
            disabled={!key}
            className="h-14 rounded-xl text-xl font-medium transition-colors disabled:invisible"
            style={{
              background: key === 'del' ? 'transparent' : 'rgba(255,255,255,0.06)',
              color: key === 'del' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
            }}
          >
            {key === 'del' ? <Delete size={20} className="mx-auto" /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}

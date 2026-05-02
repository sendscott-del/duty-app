import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SirFlush } from '../../components/ui/SirFlush'
import { AVATAR_COLORS } from '../../lib/utils'
import { CHORE_PRESETS, REWARD_PRESETS } from '../../lib/presets'

const STEPS = ['Family', 'Kids', 'Chores', 'Rewards']
const COLOR_OPTIONS = Object.keys(AVATAR_COLORS)

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? 'var(--yellow)' : '#fff',
  color: 'var(--ink)',
  border: '2.5px solid var(--ink)',
  borderRadius: 10,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 800,
  boxShadow: active ? 'var(--shadow-sm)' : 'none',
  cursor: 'pointer',
})

export function Setup() {
  const [step, setStep] = useState(0)
  const [familyName, setFamilyName] = useState('')
  const [kids, setKids] = useState<{ name: string; color: string; pin: string }[]>([])
  const [kidName, setKidName] = useState('')
  const [kidColor, setKidColor] = useState('purple')
  const [kidPin, setKidPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedChores, setSelectedChores] = useState<Set<string>>(new Set())
  const [selectedRewards, setSelectedRewards] = useState<Set<string>>(new Set())
  const { profile, setFamily } = useStore()
  const { loadProfile } = useAuth()
  const navigate = useNavigate()

  async function createFamily() {
    setSaving(true)
    const { data: family } = await supabase.from('duty_families').insert({ name: familyName }).select().single()
    if (family && profile) {
      await supabase.from('duty_profiles').update({ family_id: family.id }).eq('id', profile.id)
      setFamily(family)
      useStore.getState().setProfile({ ...profile, family_id: family.id })
    }
    setSaving(false); setStep(1)
  }
  function addKid() {
    if (!kidName.trim()) return
    setKids([...kids, { name: kidName.trim(), color: kidColor, pin: kidPin }])
    setKidName(''); setKidPin('')
    setKidColor(COLOR_OPTIONS[(kids.length + 1) % COLOR_OPTIONS.length])
  }
  async function saveKids() {
    setSaving(true)
    const { family } = useStore.getState()
    if (!family) { setSaving(false); return }
    try {
      for (const kid of kids) {
        await supabase.from('duty_profiles').insert({
          id: crypto.randomUUID(), full_name: kid.name, role: 'kid',
          family_id: family.id, avatar_color: kid.color, pin: kid.pin,
        })
      }
      if (profile) await loadProfile(profile.id)
    } catch {}
    setSaving(false); setStep(2)
  }
  async function saveChores() {
    const { family } = useStore.getState()
    if (!family) { setStep(3); return }
    setSaving(true)
    for (const c of CHORE_PRESETS.filter(p => selectedChores.has(p.name))) {
      await supabase.from('duty_chores').insert({
        family_id: family.id, name: c.name, emoji: c.emoji, points: c.points, assigned_by: profile?.id,
      })
    }
    setSaving(false); setStep(3)
  }
  async function finish() {
    const { family } = useStore.getState()
    if (family) {
      setSaving(true)
      for (const r of REWARD_PRESETS.filter(p => selectedRewards.has(p.name))) {
        await supabase.from('duty_rewards').insert({
          family_id: family.id, name: r.name, emoji: r.emoji, points_cost: r.points_cost,
        })
      }
      setSaving(false)
    }
    navigate('/parent/overview')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-3">
          <SirFlush size={56} expression="wink" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                width: i === step ? 18 : 8,
                height: 8,
                borderRadius: 999,
                background: i <= step ? 'var(--ink)' : 'var(--ink-15)',
                transition: 'all 200ms',
              }}
            />
          ))}
        </div>

        <div
          style={{
            background: '#fff',
            border: '3px solid var(--ink)',
            borderRadius: 18,
            padding: 18,
            boxShadow: 'var(--shadow)',
          }}
        >
          {step === 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>Name your family</h2>
              <p className="text-sm font-bold mb-4 mt-1" style={{ color: 'var(--ink-50)' }}>This shows on everyone's dashboard.</p>
              <Input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="The Johnson Family" />
              <Button fullWidth className="mt-4" onClick={createFamily} loading={saving} disabled={!familyName.trim()}>
                Next
              </Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>Add your kids</h2>
              <p className="text-sm font-bold mb-4 mt-1" style={{ color: 'var(--ink-50)' }}>They'll log in with a 4-digit PIN.</p>

              {kids.map((k, i) => (
                <div key={i} className="flex items-center gap-2 mb-2"
                  style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 10, padding: '6px 12px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: AVATAR_COLORS[k.color].bg, border: '2px solid var(--ink)' }} />
                  <span className="font-bold">{k.name}</span>
                </div>
              ))}

              <div className="space-y-3 mt-3">
                <Input label="Kid's name" value={kidName} onChange={e => setKidName(e.target.value)} placeholder="Olivia" />
                <Input label="4-digit PIN" value={kidPin} onChange={e => setKidPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} />
                <div>
                  <label className="stadium-eyebrow block mb-1.5">COLOR</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button key={c} onClick={() => setKidColor(c)}
                        style={{ width: 30, height: 30, borderRadius: '50%', background: AVATAR_COLORS[c].bg, border: kidColor === c ? '3px solid var(--ink)' : '2px solid var(--ink)', boxShadow: kidColor === c ? 'var(--shadow-sm)' : 'none' }} />
                    ))}
                  </div>
                </div>
                <Button variant="secondary" fullWidth onClick={addKid} disabled={!kidName.trim() || kidPin.length < 4}>
                  + Add kid
                </Button>
              </div>

              <Button fullWidth className="mt-5" onClick={saveKids} loading={saving} disabled={kids.length === 0}>
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>Add some chores</h2>
              <p className="text-sm font-bold mb-4 mt-1" style={{ color: 'var(--ink-50)' }}>You can always add more later.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {CHORE_PRESETS.map(p => {
                  const active = selectedChores.has(p.name)
                  return (
                    <button key={p.name}
                      onClick={() => setSelectedChores(prev => { const n = new Set(prev); active ? n.delete(p.name) : n.add(p.name); return n })}
                      style={chip(active)}>
                      {p.emoji} {p.name}
                    </button>
                  )
                })}
              </div>
              <Button fullWidth onClick={saveChores} loading={saving}>Next</Button>
              <button onClick={() => setStep(3)} className="w-full text-center text-xs font-bold mt-3" style={{ color: 'var(--ink-50)' }}>Skip</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1 }}>Add some rewards</h2>
              <p className="text-sm font-bold mb-4 mt-1" style={{ color: 'var(--ink-50)' }}>Give them something to work toward.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {REWARD_PRESETS.map(p => {
                  const active = selectedRewards.has(p.name)
                  return (
                    <button key={p.name}
                      onClick={() => setSelectedRewards(prev => { const n = new Set(prev); active ? n.delete(p.name) : n.add(p.name); return n })}
                      style={chip(active)}>
                      {p.emoji} {p.name} · {p.points_cost}
                    </button>
                  )
                })}
              </div>
              <Button fullWidth onClick={finish} loading={saving}>Start using Duty 🚽</Button>
              <button onClick={() => navigate('/parent/overview')} className="w-full text-center text-xs font-bold mt-3" style={{ color: 'var(--ink-50)' }}>Skip</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

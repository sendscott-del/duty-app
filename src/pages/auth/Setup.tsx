import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AVATAR_COLORS } from '../../lib/utils'
import { CHORE_PRESETS, REWARD_PRESETS } from '../../lib/presets'

const STEPS = ['Family', 'Kids', 'Chores', 'Rewards']
const COLOR_OPTIONS = Object.keys(AVATAR_COLORS)

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
    const { data: family } = await supabase
      .from('duty_families')
      .insert({ name: familyName })
      .select()
      .single()

    if (family && profile) {
      await supabase.from('duty_profiles').update({ family_id: family.id }).eq('id', profile.id)
      setFamily(family)
      useStore.getState().setProfile({ ...profile, family_id: family.id })
    }
    setSaving(false)
    setStep(1)
  }

  function addKid() {
    if (!kidName.trim()) return
    setKids([...kids, { name: kidName.trim(), color: kidColor, pin: kidPin }])
    setKidName('')
    setKidPin('')
    setKidColor(COLOR_OPTIONS[(kids.length + 1) % COLOR_OPTIONS.length])
  }

  async function saveKids() {
    setSaving(true)
    const { family } = useStore.getState()
    if (!family) { setSaving(false); return }

    try {
      for (const kid of kids) {
        const { error } = await supabase.from('duty_profiles').insert({
          id: crypto.randomUUID(),
          full_name: kid.name,
          role: 'kid',
          family_id: family.id,
          avatar_color: kid.color,
          pin: kid.pin,
        })
        if (error) console.warn('Kid insert error:', error.message)
      }

      if (profile) await loadProfile(profile.id)
    } catch (e) {
      console.warn('saveKids error:', e)
    }
    setSaving(false)
    setStep(2)
  }

  async function saveChores() {
    const { family } = useStore.getState()
    if (!family) { setStep(3); return }
    setSaving(true)
    const choresToInsert = CHORE_PRESETS.filter(p => selectedChores.has(p.name))
    for (const c of choresToInsert) {
      await supabase.from('duty_chores').insert({
        family_id: family.id,
        name: c.name,
        emoji: c.emoji,
        points: c.points,
        assigned_by: profile?.id,
      })
    }
    setSaving(false)
    setStep(3)
  }

  async function finish() {
    const { family } = useStore.getState()
    if (family) {
      setSaving(true)
      const rewardsToInsert = REWARD_PRESETS.filter(p => selectedRewards.has(p.name))
      for (const r of rewardsToInsert) {
        await supabase.from('duty_rewards').insert({
          family_id: family.id,
          name: r.name,
          emoji: r.emoji,
          points_cost: r.points_cost,
        })
      }
      setSaving(false)
    }
    navigate('/parent/overview')
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-5" style={{ background: 'var(--p-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`w-2 h-2 rounded-full ${i <= step ? 'bg-[var(--gold)]' : 'bg-[var(--p-dim)]'}`} />
          ))}
        </div>

        {/* Step 0: Family name */}
        {step === 0 && (
          <div>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--p-text)' }}>Name your family</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--p-muted)' }}>This shows on everyone's dashboard.</p>
            <Input value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="The Johnson Family" />
            <Button fullWidth className="mt-4" onClick={createFamily} loading={saving} disabled={!familyName.trim()}>
              Next
            </Button>
          </div>
        )}

        {/* Step 1: Add kids */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--p-text)' }}>Add your kids</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--p-muted)' }}>They'll log in with a 4-digit PIN.</p>

            {kids.map((k, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2" style={{ background: 'var(--p-card)' }}>
                <div className="w-6 h-6 rounded-full" style={{ background: AVATAR_COLORS[k.color].bg }} />
                <span className="text-sm" style={{ color: 'var(--p-text)' }}>{k.name}</span>
              </div>
            ))}

            <div className="space-y-3 mt-4">
              <Input label="Kid's name" value={kidName} onChange={e => setKidName(e.target.value)} placeholder="Olivia" />
              <Input label="4-digit PIN" value={kidPin} onChange={e => setKidPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} />
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--p-muted)' }}>Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setKidColor(c)}
                      className={`w-8 h-8 rounded-full ${kidColor === c ? 'ring-2 ring-[var(--gold)]' : ''}`}
                      style={{ background: AVATAR_COLORS[c].bg }}
                    />
                  ))}
                </div>
              </div>
              <Button variant="outline" fullWidth onClick={addKid} disabled={!kidName.trim() || kidPin.length < 4}>
                + Add kid
              </Button>
            </div>

            <Button fullWidth className="mt-6" onClick={saveKids} loading={saving} disabled={kids.length === 0}>
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Chores */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--p-text)' }}>Add some chores</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--p-muted)' }}>You can always add more later.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {CHORE_PRESETS.map(p => {
                const active = selectedChores.has(p.name)
                return (
                  <button key={p.name}
                    onClick={() => setSelectedChores(prev => { const n = new Set(prev); active ? n.delete(p.name) : n.add(p.name); return n })}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: active ? 'var(--gold-dim)' : 'var(--p-card)', color: active ? 'var(--gold)' : 'var(--p-text)', border: active ? '1px solid var(--gold)' : '1px solid var(--p-border)' }}>
                    {p.emoji} {p.name}
                  </button>
                )
              })}
            </div>
            <Button fullWidth onClick={saveChores} loading={saving}>Next</Button>
            <button onClick={() => setStep(3)} className="w-full text-center text-xs mt-3" style={{ color: 'var(--p-dim)' }}>Skip</button>
          </div>
        )}

        {/* Step 3: Rewards */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: 'var(--p-text)' }}>Add some rewards</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--p-muted)' }}>Give them something to work toward.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {REWARD_PRESETS.map(p => {
                const active = selectedRewards.has(p.name)
                return (
                  <button key={p.name}
                    onClick={() => setSelectedRewards(prev => { const n = new Set(prev); active ? n.delete(p.name) : n.add(p.name); return n })}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: active ? 'var(--gold-dim)' : 'var(--p-card)', color: active ? 'var(--gold)' : 'var(--p-text)', border: active ? '1px solid var(--gold)' : '1px solid var(--p-border)' }}>
                    {p.emoji} {p.name} ({p.points_cost} pts)
                  </button>
                )
              })}
            </div>
            <Button fullWidth onClick={finish} loading={saving}>Start using Duty 💩</Button>
            <button onClick={() => navigate('/parent/overview')} className="w-full text-center text-xs mt-3" style={{ color: 'var(--p-dim)' }}>Skip</button>
          </div>
        )}
      </div>
    </div>
  )
}

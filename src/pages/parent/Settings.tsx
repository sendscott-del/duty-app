import { useState } from 'react'
import { useStore } from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { AVATAR_COLORS } from '../../lib/utils'
import { LogOut, Plus, Pencil, Trash2 } from 'lucide-react'

const COLOR_OPTIONS = Object.keys(AVATAR_COLORS)

export function Settings() {
  const { family, kids, profile } = useStore()
  const { signOut, loadProfile } = useAuth()

  const [showKidForm, setShowKidForm] = useState(false)
  const [editKid, setEditKid] = useState<any>(null)
  const [kidName, setKidName] = useState('')
  const [kidColor, setKidColor] = useState('purple')
  const [kidPin, setKidPin] = useState('')
  const [saving, setSaving] = useState(false)

  function openAddKid() {
    setEditKid(null)
    setKidName('')
    setKidColor(COLOR_OPTIONS[kids.length % COLOR_OPTIONS.length])
    setKidPin('')
    setShowKidForm(true)
  }

  function openEditKid(kid: any) {
    setEditKid(kid)
    setKidName(kid.full_name)
    setKidColor(kid.avatar_color)
    setKidPin(kid.pin || '')
    setShowKidForm(true)
  }

  async function handleSaveKid() {
    if (!kidName.trim() || !family) return
    setSaving(true)

    if (editKid) {
      await supabase.from('duty_profiles').update({
        full_name: kidName.trim(),
        avatar_color: kidColor,
        pin: kidPin || null,
      }).eq('id', editKid.id)
    } else {
      await supabase.from('duty_profiles').insert({
        id: crypto.randomUUID(),
        full_name: kidName.trim(),
        role: 'kid',
        family_id: family.id,
        avatar_color: kidColor,
        pin: kidPin || null,
      })
    }

    if (profile) await loadProfile(profile.id)
    setSaving(false)
    setShowKidForm(false)
  }

  async function handleDeleteKid(kid: any) {
    if (!window.confirm(`Remove ${kid.full_name}? This can't be undone.`)) return
    await supabase.from('duty_profiles').delete().eq('id', kid.id)
    if (profile) await loadProfile(profile.id)
  }

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <h1 className="font-display text-xl font-bold mb-6" style={{ color: 'var(--p-text)' }}>Settings</h1>

      {/* Family */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--p-dim)' }}>Family</div>
        <div className="text-lg font-medium" style={{ color: 'var(--p-text)' }}>{family?.name}</div>
      </div>

      {/* Kid Login Link */}
      {family && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
          <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--p-dim)' }}>Kid Login Link</div>
          <p className="text-xs mb-2" style={{ color: 'var(--p-muted)' }}>Share this link with your kids so they can log in with their PIN.</p>
          <button
            onClick={() => {
              const url = `${window.location.origin}/kid-login?f=${family.id}`
              navigator.clipboard.writeText(url)
              alert('Link copied!')
            }}
            className="text-sm font-medium px-3 py-2 rounded-lg"
            style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
          >
            Copy Kid Login Link
          </button>
        </div>
      )}

      {/* Kids */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--p-dim)' }}>Kids</div>
          <button
            onClick={openAddKid}
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--gold)', background: 'var(--gold-dim)' }}
          >
            <Plus size={12} /> Add Kid
          </button>
        </div>
        <div className="space-y-2">
          {kids.map(kid => (
            <div key={kid.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] group">
              <Avatar name={kid.full_name} color={kid.avatar_color} />
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: 'var(--p-text)' }}>{kid.full_name}</div>
                <div className="text-[11px]" style={{ color: 'var(--p-dim)' }}>
                  PIN: {kid.pin || 'Not set'}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEditKid(kid)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                  style={{ color: 'var(--p-muted)' }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDeleteKid(kid)}
                  className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                  style={{ color: 'var(--red)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {kids.length === 0 && (
            <div className="text-sm" style={{ color: 'var(--p-muted)' }}>No kids added yet.</div>
          )}
        </div>
      </div>

      {/* Amazon */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--p-dim)' }}>Amazon Associates</div>
        <div className="text-sm mb-2" style={{ color: 'var(--p-text)' }}>
          Tag: {family?.amazon_tag || 'Not set'}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--p-dim)' }}>
          As an Amazon Associate, Duty earns from qualifying purchases.
        </p>
      </div>

      <Button variant="red" fullWidth onClick={signOut}>
        <LogOut size={16} /> Sign Out
      </Button>

      {/* Add/Edit Kid Modal */}
      <Modal open={showKidForm} onClose={() => setShowKidForm(false)} title={editKid ? 'Edit Kid' : 'Add Kid'}>
        <div className="space-y-4">
          <Input label="Name" value={kidName} onChange={e => setKidName(e.target.value)} placeholder="e.g. Olivia" />
          <Input label="4-digit PIN" value={kidPin} onChange={e => setKidPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} />

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setKidColor(c)}
                  className={`w-9 h-9 rounded-full transition-all ${kidColor === c ? 'ring-2 ring-[var(--gold)] scale-110' : ''}`}
                  style={{ background: AVATAR_COLORS[c].bg }}
                />
              ))}
            </div>
          </div>

          <Button fullWidth onClick={handleSaveKid} loading={saving} disabled={!kidName.trim()}>
            {editKid ? 'Save Changes' : 'Add Kid'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { CHORE_PRESETS, CHORE_EMOJIS } from '../../lib/presets'

interface AddChoreSheetProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const POINT_PRESETS = [10, 20, 25, 30, 40, 50]

export function AddChoreSheet({ open, onClose, onSaved }: AddChoreSheetProps) {
  const { family, kids, profile } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const [points, setPoints] = useState(10)
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [requiresProof, setRequiresProof] = useState(false)
  const [saving, setSaving] = useState(false)

  function applyPreset(preset: typeof CHORE_PRESETS[0]) {
    setName(preset.name)
    setEmoji(preset.emoji)
    setPoints(preset.points)
  }

  async function handleSave() {
    if (!name.trim() || !family) return
    setSaving(true)

    await supabase.from('duty_chores').insert({
      family_id: family.id,
      assigned_to: assignedTo || null,
      assigned_by: profile?.id,
      name: name.trim(),
      emoji,
      points,
      due_date: dueDate || null,
      requires_proof: requiresProof,
    })

    setSaving(false)
    setName('')
    setEmoji('✅')
    setPoints(10)
    setAssignedTo('')
    setRequiresProof(false)
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Chore">
      <div className="space-y-4">
        {/* Preset chips */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Quick add</label>
          <div className="flex flex-wrap gap-1.5">
            {CHORE_PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                style={{ background: 'var(--p-card)', color: 'var(--p-text)', border: '1px solid var(--p-border)' }}
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <Input label="Chore name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Take out trash" />

        {/* Emoji picker */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {CHORE_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${emoji === e ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: emoji === e ? 'var(--gold-dim)' : 'var(--p-card)' }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Assign to */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Assign to</label>
          <div className="flex gap-2">
            {kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => setAssignedTo(kid.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${assignedTo === kid.id ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: assignedTo === kid.id ? 'var(--gold-dim)' : 'var(--p-card)', color: 'var(--p-text)', border: '1px solid var(--p-border)' }}
              >
                <Avatar name={kid.full_name} color={kid.avatar_color} size="sm" />
                {kid.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Points */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Points</label>
          <div className="flex gap-1.5">
            {POINT_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setPoints(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${points === p ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: points === p ? 'var(--gold-dim)' : 'var(--p-card)', color: points === p ? 'var(--gold)' : 'var(--p-muted)' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

        {/* Require proof */}
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--p-text)' }}>
          <input
            type="checkbox"
            checked={requiresProof}
            onChange={e => setRequiresProof(e.target.checked)}
            className="accent-[var(--gold)]"
          />
          Require photo proof
        </label>

        <Button fullWidth onClick={handleSave} loading={saving} disabled={!name.trim()}>
          Add Chore
        </Button>
      </div>
    </Modal>
  )
}

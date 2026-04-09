import { useState, useEffect } from 'react'
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
  editChore?: any
}

const POINT_PRESETS = [10, 20, 25, 30, 40, 50]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

export function AddChoreSheet({ open, onClose, onSaved, editChore }: AddChoreSheetProps) {
  const { family, kids, profile } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✅')
  const [points, setPoints] = useState(10)
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [recurrence, setRecurrence] = useState<string>('none')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [requiresProof, setRequiresProof] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editChore) {
      setName(editChore.name)
      setEmoji(editChore.emoji)
      setPoints(editChore.points)
      setAssignedTo(editChore.assigned_to || '')
      setDueDate(editChore.due_date || new Date().toISOString().split('T')[0])
      setRecurrence(editChore.recurrence || 'none')
      setRecurrenceDays(editChore.recurrence_days || [])
      setRequiresProof(editChore.requires_proof || false)
    } else {
      setName('')
      setEmoji('✅')
      setPoints(10)
      setAssignedTo('')
      setDueDate(new Date().toISOString().split('T')[0])
      setRecurrence('none')
      setRecurrenceDays([])
      setRequiresProof(false)
    }
  }, [editChore, open])

  function applyPreset(preset: typeof CHORE_PRESETS[0]) {
    setName(preset.name)
    setEmoji(preset.emoji)
    setPoints(preset.points)
  }

  function toggleDay(day: number) {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleSave() {
    if (!name.trim() || !family) return
    setSaving(true)

    const data = {
      name: name.trim(),
      emoji,
      points,
      assigned_to: assignedTo || null,
      due_date: recurrence === 'none' ? (dueDate || null) : null,
      recurrence,
      recurrence_days: recurrence === 'weekly' && recurrenceDays.length > 0 ? recurrenceDays : null,
      requires_proof: requiresProof,
    }

    if (editChore) {
      await supabase.from('duty_chores').update(data).eq('id', editChore.id)
    } else {
      await supabase.from('duty_chores').insert({
        ...data,
        family_id: family.id,
        assigned_by: profile?.id,
      })
    }

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editChore ? 'Edit Chore' : 'Add Chore'}>
      <div className="space-y-4">
        {/* Preset chips (new only) */}
        {!editChore && <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Quick add</label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
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
        </div>}

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
          <div className="flex gap-2 flex-wrap">
            {kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => setAssignedTo(kid.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${assignedTo === kid.id ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: assignedTo === kid.id ? 'var(--gold-dim)' : 'var(--p-card)', color: 'var(--p-text)', border: '1px solid var(--p-border)' }}
              >
                <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
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

        {/* Recurrence */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Frequency</label>
          <div className="flex gap-1.5">
            {RECURRENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRecurrence(opt.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${recurrence === opt.value ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: recurrence === opt.value ? 'var(--gold-dim)' : 'var(--p-card)', color: recurrence === opt.value ? 'var(--gold)' : 'var(--p-muted)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Day of week picker (weekly only) */}
        {recurrence === 'weekly' && (
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Which days?</label>
            <div className="flex gap-1.5">
              {DAYS.map((day, i) => {
                const selected = recurrenceDays.includes(i)
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${selected ? 'ring-2 ring-[var(--gold)]' : ''}`}
                    style={{ background: selected ? 'var(--gold-dim)' : 'var(--p-card)', color: selected ? 'var(--gold)' : 'var(--p-muted)' }}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Due date (one-time only) */}
        {recurrence === 'none' && (
          <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        )}

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
          {editChore ? 'Save Changes' : 'Add Chore'}
        </Button>
      </div>
    </Modal>
  )
}

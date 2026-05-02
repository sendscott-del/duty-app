import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { CHORE_PRESETS, CHORE_EMOJIS } from '../../lib/presets'

interface AddChoreSheetProps { open: boolean; onClose: () => void; onSaved: () => void; editChore?: any }

const POINT_PRESETS = [10, 20, 25, 30, 40, 50]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RECURRENCE_OPTIONS = [
  { value: 'none',    label: 'One time' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const

const tile = (active: boolean): React.CSSProperties => ({
  background: active ? 'var(--yellow)' : '#fff',
  color: 'var(--ink)',
  border: '2.5px solid var(--ink)',
  borderRadius: 10,
  fontWeight: 800,
  padding: '8px 10px',
  cursor: 'pointer',
  boxShadow: active ? 'var(--shadow-sm)' : 'none',
})

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
      setName(editChore.name); setEmoji(editChore.emoji); setPoints(editChore.points)
      setAssignedTo(editChore.assigned_to || '')
      setDueDate(editChore.due_date || new Date().toISOString().split('T')[0])
      setRecurrence(editChore.recurrence || 'none')
      setRecurrenceDays(editChore.recurrence_days || [])
      setRequiresProof(editChore.requires_proof || false)
    } else {
      setName(''); setEmoji('✅'); setPoints(10); setAssignedTo('')
      setDueDate(new Date().toISOString().split('T')[0])
      setRecurrence('none'); setRecurrenceDays([]); setRequiresProof(false)
    }
  }, [editChore, open])

  function applyPreset(p: typeof CHORE_PRESETS[0]) {
    setName(p.name); setEmoji(p.emoji); setPoints(p.points)
  }
  function toggleDay(d: number) { setRecurrenceDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]) }

  async function handleSave() {
    if (!name.trim() || !family) return
    setSaving(true)
    const data = {
      name: name.trim(), emoji, points,
      assigned_to: assignedTo || null,
      due_date: recurrence === 'none' ? (dueDate || null) : null,
      recurrence,
      recurrence_days: recurrence === 'weekly' && recurrenceDays.length > 0 ? recurrenceDays : null,
      requires_proof: requiresProof,
    }
    if (editChore) {
      await supabase.from('duty_chores').update(data).eq('id', editChore.id)
    } else {
      await supabase.from('duty_chores').insert({ ...data, family_id: family.id, assigned_by: profile?.id })
    }
    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editChore ? 'Edit Chore' : 'Add Chore'}>
      <div className="space-y-4">
        {!editChore && (
          <div>
            <label className="stadium-eyebrow block mb-2">QUICK ADD</label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {CHORE_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)} style={tile(false)} className="text-xs">
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input label="Chore name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Take out trash" />

        <div>
          <label className="stadium-eyebrow block mb-2">ICON</label>
          <div className="flex flex-wrap gap-1.5">
            {CHORE_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{ width: 40, height: 40, fontSize: 18, ...tile(emoji === e) }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="stadium-eyebrow block mb-2">ASSIGN TO</label>
          <div className="flex gap-2 flex-wrap">
            {kids.map(kid => (
              <button key={kid.id} onClick={() => setAssignedTo(kid.id)}
                className="flex items-center gap-2"
                style={{ ...tile(assignedTo === kid.id), borderRadius: 999, padding: '4px 14px 4px 4px' }}>
                <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />
                {kid.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="stadium-eyebrow block mb-2">POINTS</label>
          <div className="flex gap-1.5">
            {POINT_PRESETS.map(p => (
              <button key={p} onClick={() => setPoints(p)} className="flex-1" style={tile(points === p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="stadium-eyebrow block mb-2">FREQUENCY</label>
          <div className="flex gap-1.5">
            {RECURRENCE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setRecurrence(opt.value)} className="flex-1 text-xs" style={tile(recurrence === opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {recurrence === 'weekly' && (
          <div>
            <label className="stadium-eyebrow block mb-2">WHICH DAYS?</label>
            <div className="flex gap-1.5">
              {DAYS.map((day, i) => (
                <button key={i} onClick={() => toggleDay(i)} className="flex-1 text-xs" style={tile(recurrenceDays.includes(i))}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {recurrence === 'none' && (
          <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        )}

        <label className="flex items-center gap-2 font-bold cursor-pointer" style={{ color: 'var(--ink)' }}>
          <input
            type="checkbox"
            checked={requiresProof}
            onChange={e => setRequiresProof(e.target.checked)}
            className="accent-[var(--red)]"
            style={{ width: 18, height: 18 }}
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

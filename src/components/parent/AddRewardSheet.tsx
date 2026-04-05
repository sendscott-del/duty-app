import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { REWARD_PRESETS } from '../../lib/presets'

interface AddRewardSheetProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const REWARD_EMOJIS = ['🎮', '🌙', '🍕', '🎬', '😴', '💵', '🎁', '🍦', '🎨', '🏊', '🎯', '⭐']
const POINT_PRESETS = [100, 150, 200, 300, 400, 500]
const TYPE_OPTIONS = [
  { value: 'experience', label: 'Experience' },
  { value: 'privilege', label: 'Privilege' },
  { value: 'item', label: 'Item' },
]

export function AddRewardSheet({ open, onClose, onSaved }: AddRewardSheetProps) {
  const { family } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [pointsCost, setPointsCost] = useState(200)
  const [rewardType, setRewardType] = useState('experience')
  const [saving, setSaving] = useState(false)

  function applyPreset(preset: typeof REWARD_PRESETS[0]) {
    setName(preset.name)
    setEmoji(preset.emoji)
    setPointsCost(preset.points_cost)
    setRewardType(preset.reward_type)
  }

  async function handleSave() {
    if (!name.trim() || !family) return
    setSaving(true)

    await supabase.from('duty_rewards').insert({
      family_id: family.id,
      name: name.trim(),
      emoji,
      points_cost: pointsCost,
      reward_type: rewardType,
    })

    setSaving(false)
    setName('')
    setEmoji('🎁')
    setPointsCost(200)
    setRewardType('experience')
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Reward">
      <div className="space-y-4">
        {/* Preset chips */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Quick add</label>
          <div className="flex flex-wrap gap-1.5">
            {REWARD_PRESETS.map(p => (
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
        <Input label="Reward name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Extra screen time" />

        {/* Emoji picker */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {REWARD_EMOJIS.map(e => (
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

        {/* Points cost */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Points cost</label>
          <div className="flex gap-1.5">
            {POINT_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setPointsCost(p)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${pointsCost === p ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: pointsCost === p ? 'var(--gold-dim)' : 'var(--p-card)', color: pointsCost === p ? 'var(--gold)' : 'var(--p-muted)' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--p-muted)' }}>Type</label>
          <div className="flex gap-1.5">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                onClick={() => setRewardType(t.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${rewardType === t.value ? 'ring-2 ring-[var(--gold)]' : ''}`}
                style={{ background: rewardType === t.value ? 'var(--gold-dim)' : 'var(--p-card)', color: rewardType === t.value ? 'var(--gold)' : 'var(--p-muted)' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth onClick={handleSave} loading={saving} disabled={!name.trim()}>
          Add Reward
        </Button>
      </div>
    </Modal>
  )
}

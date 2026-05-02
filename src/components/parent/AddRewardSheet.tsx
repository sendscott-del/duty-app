import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { REWARD_PRESETS } from '../../lib/presets'

interface AddRewardSheetProps { open: boolean; onClose: () => void; onSaved: () => void; editReward?: any }

const REWARD_EMOJIS = ['🎮', '🌙', '🍕', '🎬', '😴', '💵', '🎁', '🍦', '🎨', '🏊', '🎯', '⭐', '🎲', '🛝', '🎳', '📚']
const POINT_PRESETS = [100, 150, 200, 300, 400, 500]
const TYPE_OPTIONS = [
  { value: 'experience', label: 'Experience' },
  { value: 'privilege',  label: 'Privilege' },
  { value: 'item',       label: 'Item' },
]

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

export function AddRewardSheet({ open, onClose, onSaved, editReward }: AddRewardSheetProps) {
  const { family } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [pointsCost, setPointsCost] = useState(200)
  const [rewardType, setRewardType] = useState('experience')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editReward) {
      setName(editReward.name); setEmoji(editReward.emoji)
      setPointsCost(editReward.points_cost); setRewardType(editReward.reward_type)
    } else {
      setName(''); setEmoji('🎁'); setPointsCost(200); setRewardType('experience')
    }
  }, [editReward, open])

  function applyPreset(p: typeof REWARD_PRESETS[0]) {
    setName(p.name); setEmoji(p.emoji)
    setPointsCost(p.points_cost); setRewardType(p.reward_type)
  }

  async function handleSave() {
    if (!name.trim() || !family) return
    setSaving(true)
    if (editReward) {
      await supabase.from('duty_rewards').update({
        name: name.trim(), emoji, points_cost: pointsCost, reward_type: rewardType,
      }).eq('id', editReward.id)
    } else {
      await supabase.from('duty_rewards').insert({
        family_id: family.id, name: name.trim(), emoji, points_cost: pointsCost, reward_type: rewardType,
      })
    }
    setSaving(false); onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editReward ? 'Edit Reward' : 'Add Reward'}>
      <div className="space-y-4">
        {!editReward && (
          <div>
            <label className="stadium-eyebrow block mb-2">QUICK ADD</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {REWARD_PRESETS.map(p => (
                <button key={p.name} onClick={() => applyPreset(p)} style={tile(false)} className="text-xs">
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input label="Reward name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Extra screen time" />

        <div>
          <label className="stadium-eyebrow block mb-2">ICON</label>
          <div className="flex flex-wrap gap-1.5">
            {REWARD_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{ width: 40, height: 40, fontSize: 18, ...tile(emoji === e) }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="stadium-eyebrow block mb-2">POINTS COST</label>
          <div className="flex gap-1.5">
            {POINT_PRESETS.map(p => (
              <button key={p} onClick={() => setPointsCost(p)} className="flex-1" style={tile(pointsCost === p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="stadium-eyebrow block mb-2">TYPE</label>
          <div className="flex gap-1.5">
            {TYPE_OPTIONS.map(t => (
              <button key={t.value} onClick={() => setRewardType(t.value)} className="flex-1" style={tile(rewardType === t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Button fullWidth onClick={handleSave} loading={saving} disabled={!name.trim()}>
          {editReward ? 'Save Changes' : 'Add Reward'}
        </Button>
      </div>
    </Modal>
  )
}

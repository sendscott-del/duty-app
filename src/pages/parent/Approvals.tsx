import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ThumbsDown, X, Inbox, CheckCheck } from 'lucide-react'
import { useChores } from '../../hooks/useChores'
import { useCompletions } from '../../hooks/useCompletions'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { SirFlush } from '../../components/ui/SirFlush'
import confetti from 'canvas-confetti'

function formatDateHeader(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff < -1 && diff >= -6) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function Approvals() {
  const { chores, loading: choresLoading } = useChores()
  const { completions, loading: compsLoading, approveCompletion, rejectCompletion, undoCompletion } = useCompletions()
  const { profile, kids } = useStore()
  const [bulkBusy, setBulkBusy] = useState(false)

  const pending = useMemo(() => {
    const choreMap = new Map(chores.map(c => [c.id, c]))
    const rows = completions
      .filter(c => c.status === 'submitted')
      .map(c => {
        const chore = choreMap.get(c.chore_id)
        const kid = kids.find(k => k.id === c.completed_by)
        return chore ? { completion: c, chore, kid } : null
      })
      .filter(Boolean) as { completion: any; chore: any; kid: any }[]
    const byDate = new Map<string, typeof rows>()
    for (const row of rows) {
      const key = row.completion.completion_date
      if (!byDate.has(key)) byDate.set(key, [])
      byDate.get(key)!.push(row)
    }
    return Array.from(byDate.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [completions, chores, kids])

  const totalPending = pending.reduce((sum, [, rows]) => sum + rows.length, 0)

  async function handleApprove(row: { completion: any; chore: any }) {
    if (!profile) return
    await approveCompletion(row.completion.id, profile.id)
    if (!row.completion.completed_late) {
      await supabase.from('duty_point_transactions').insert({
        profile_id: row.completion.completed_by, family_id: row.chore.family_id,
        amount: row.chore.points, reason: `Completed: ${row.chore.name}`,
        reference_id: row.completion.id, reference_type: 'chore', created_by: profile.id,
      })
    }
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
  }
  async function handleReject(row: { completion: any }) { await rejectCompletion(row.completion.id) }
  async function handleClear(row: { completion: any; chore: any }) { await undoCompletion(row.chore.id, row.completion.completion_date) }
  async function handleApproveAll() {
    if (!profile || totalPending === 0) return
    if (!window.confirm(`Approve all ${totalPending} pending ${totalPending === 1 ? 'chore' : 'chores'}?`)) return
    setBulkBusy(true)
    const all = pending.flatMap(([, rows]) => rows)
    for (const row of all) await handleApprove(row)
    setBulkBusy(false)
  }

  if (choresLoading || compsLoading) return <Spinner size="lg" />

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="flex items-end justify-between mb-6 gap-3">
        <div className="min-w-0">
          <div className="stadium-eyebrow">APPROVALS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, color: 'var(--ink)' }}>
            {totalPending === 0 ? 'All caught up' : `${totalPending} waiting`}
          </h1>
        </div>
        {totalPending > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={bulkBusy}
            className="flex items-center gap-1.5 disabled:opacity-50"
            style={{
              background: 'var(--green)', color: '#fff',
              border: '3px solid var(--ink)', borderRadius: 12,
              padding: '10px 14px', fontFamily: 'var(--font-display)', fontSize: 14,
              boxShadow: 'var(--shadow-sm)', textShadow: '2px 2px 0 var(--ink)',
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={16} strokeWidth={3} />
            <span className="hidden sm:inline">APPROVE ALL</span>
            <span className="sm:hidden">ALL</span>
          </button>
        )}
      </div>

      {totalPending === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SirFlush size={120} expression="sleepy" />
          <div className="font-bold mt-3" style={{ color: 'var(--ink-50)' }}>No pending approvals.</div>
          <div className="text-xs font-bold mt-1" style={{ color: 'var(--ink-50)' }}>When kids submit chores they'll show up here.</div>
          <Inbox size={0} /> {/* keep import warm */}
        </div>
      ) : (
        <div className="space-y-6">
          {pending.map(([dateStr, rows]) => (
            <div key={dateStr}>
              <div className="stadium-eyebrow mb-2 flex items-center gap-2">
                <span>{formatDateHeader(dateStr)}</span>
                <span style={{ background: 'var(--ink)', color: 'var(--cream)', padding: '1px 6px', borderRadius: 999, fontSize: 9 }}>
                  {rows.length}
                </span>
              </div>
              <div className="space-y-2">
                {rows.map(row => (
                  <ApprovalRow key={row.completion.id} row={row} onApprove={() => handleApprove(row)} onReject={() => handleReject(row)} onClear={() => handleClear(row)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ApprovalRow({ row, onApprove, onReject, onClear }: { row: { completion: any; chore: any; kid: any }; onApprove: () => void; onReject: () => void; onClear: () => void }) {
  const { completion, chore, kid } = row
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        background: '#fff',
        border: '2.5px solid var(--ink)',
        borderRadius: 12,
        padding: 12,
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--ink)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{chore.emoji} {chore.name}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {kid && <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} size="sm" />}
            <span className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>{kid?.full_name}</span>
            {completion.completed_late && <Badge variant="amber">Late</Badge>}
            <Badge variant="gold">+{chore.points}</Badge>
          </div>
        </div>
      </div>

      {completion.proof_image_url && (
        <a href={completion.proof_image_url} target="_blank" rel="noreferrer" className="block mt-2">
          <img
            src={completion.proof_image_url}
            alt="proof"
            className="w-full max-h-48 object-cover"
            style={{ border: '2.5px solid var(--ink)', borderRadius: 10 }}
          />
        </a>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-1.5"
          style={{
            background: 'var(--green)', color: '#fff',
            border: '2.5px solid var(--ink)', borderRadius: 10,
            padding: '8px 0', fontWeight: 800, fontSize: 14,
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          }}
        >
          <CheckCircle size={15} strokeWidth={3} /> APPROVE
        </button>
        <button onClick={onReject} title="Send back for redo" style={{ background: 'var(--red)', color: '#fff', border: '2.5px solid var(--ink)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
          <ThumbsDown size={14} strokeWidth={3} />
        </button>
        <button onClick={onClear} title="Clear completion" style={{ background: '#fff', color: 'var(--ink)', border: '2.5px solid var(--ink)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
          <X size={14} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  )
}

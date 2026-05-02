import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useChores } from '../../hooks/useChores'
import { useCompletions } from '../../hooks/useCompletions'
import { useChallenges } from '../../hooks/useChallenges'
import { WeeklyChallenge } from '../../components/WeeklyChallenge'
import { usePoints } from '../../hooks/usePoints'
import { useRewards } from '../../hooks/useRewards'
import { ChoreCard } from '../../components/kid/ChoreCard'
import { RewardCard } from '../../components/kid/RewardCard'
import { PointChip } from '../../components/ui/PointChip'
import { Spinner } from '../../components/ui/Spinner'
import { SirFlush } from '../../components/ui/SirFlush'
import { Celebrate } from '../../components/kid/Celebrate'
import { Avatar } from '../../components/ui/Avatar'
import { useKidSkin } from '../../hooks/useKidSkin'
import { toLocalDateStr } from '../../lib/utils'
import { calcChallengeProgress } from '../../lib/challenges'

const list = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } } }

function formatDateLabel(date: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function KidHome() {
  const { profile, viewAsKid, setViewAsKid, kids } = useStore()
  const activeProfile = viewAsKid || profile
  const isParentPreview = !!viewAsKid
  const { chores, loading: choresLoading } = useChores()
  const { getCompletion, completeChore, undoCompletion, completions, loading: compLoading } = useCompletions()
  const { challenge, selectChallenge } = useChallenges()
  const { balance } = usePoints(activeProfile?.id)
  const { rewards } = useRewards()
  const navigate = useNavigate()
  const [viewDate, setViewDate] = useState(new Date())
  const [skin] = useKidSkin(activeProfile?.id)
  const [celebrate, setCelebrate] = useState<{ points: number } | null>(null)

  if (choresLoading || compLoading || !activeProfile) return <Spinner size="lg" />

  const isTeen = skin === 'teen'
  const dateStr = toLocalDateStr(viewDate)
  const today = toLocalDateStr(new Date())
  const isToday = dateStr === today
  const isPast = dateStr < today
  const dowShort = viewDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()

  const myChores = chores.filter(c => {
    if (c.assigned_to !== activeProfile.id) return false
    if (c.recurrence === 'daily') return true
    if (c.recurrence === 'weekly') {
      if (!c.recurrence_days?.length) return true
      return c.recurrence_days.includes(viewDate.getDay())
    }
    if (c.recurrence === 'monthly') return true
    return c.due_date === dateStr || (!c.due_date && isToday)
  })

  const enrichedChores = myChores.map(c => {
    const comp = getCompletion(c.id, dateStr)
    return { ...c, _completion: comp, _status: comp?.status ?? 'pending', _isLate: comp?.completed_late ?? false }
  })

  const doneCount = enrichedChores.filter(c => c._status === 'approved' || c._status === 'submitted').length
  const total = enrichedChores.length
  const progress = total > 0 ? (doneCount / total) * 100 : 0
  const remaining = total - doneCount

  async function handleComplete(chore: any) {
    if (chore.requires_proof) return
    await completeChore(chore.id, activeProfile!.id, dateStr, isPast)
    setCelebrate({ points: chore.points })
  }
  async function handleUndo(chore: any) { await undoCompletion(chore.id, dateStr) }

  function exitPreview() { setViewAsKid(null); navigate('/parent/overview') }

  const firstName = activeProfile.full_name.split(' ')[0]

  return (
    <>
      <Celebrate
        open={!!celebrate}
        onClose={() => setCelebrate(null)}
        points={celebrate?.points ?? 0}
        skin={skin}
      />

      <div className="flex-1 px-5 pb-8" style={isTeen ? { color: '#fff' } : undefined}>
        {isParentPreview && (
          <button
            onClick={exitPreview}
            className="flex items-center gap-2 w-full text-sm font-bold mt-2"
            style={{
              background: 'var(--yellow)',
              color: 'var(--ink)',
              border: '2.5px solid var(--ink)',
              borderRadius: 12,
              padding: '10px 14px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ArrowLeft size={14} strokeWidth={3} /> Viewing as {activeProfile.full_name} — tap to go back
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pt-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={activeProfile.full_name} color={activeProfile.avatar_color} avatarUrl={activeProfile.avatar_url} />
            <div>
              <div className="stadium-eyebrow" style={isTeen ? { color: '#888' } : undefined}>HEY,</div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: isTeen ? '#fff' : 'var(--ink)',
                }}
              >
                {firstName}
              </div>
            </div>
          </div>
          <PointChip points={balance} />
        </div>

        {/* Day navigator */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button onClick={() => setViewDate(d => new Date(d.getTime() - 86400000))} style={{ padding: 6, border: '2px solid var(--ink)', borderRadius: 8, background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <div className="font-bold flex items-center gap-2" style={{ color: isTeen ? '#fff' : 'var(--ink)' }}>
            {formatDateLabel(viewDate)}
            {!isToday && (
              <button onClick={() => setViewDate(new Date())} className="stadium-eyebrow" style={{ background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 999, padding: '2px 8px', fontSize: 10 }}>
                TODAY
              </button>
            )}
          </div>
          <button onClick={() => setViewDate(d => new Date(d.getTime() + 86400000))} style={{ padding: 6, border: '2px solid var(--ink)', borderRadius: 8, background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Hero card */}
        {!isTeen ? (
          <div
            className="relative overflow-hidden mb-4"
            style={{
              background: 'var(--blue)',
              color: '#fff',
              border: '3px solid var(--ink)',
              borderRadius: 18,
              padding: 16,
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="absolute" style={{ right: -10, bottom: -8, opacity: 0.95 }}>
              <SirFlush size={88} expression="wink" />
            </div>
            <div className="stadium-eyebrow" style={{ color: '#fff', opacity: 0.85 }}>{isToday ? 'TODAY' : ''} · {dowShort}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                lineHeight: 1,
                marginTop: 4,
                letterSpacing: '-0.03em',
              }}
            >
              {total === 0 ? 'No chores!' : `${doneCount} of ${total}`}
              {total > 0 && <><br />flushed</>}
            </div>
            {total > 0 && (
              <div style={{ marginTop: 10, maxWidth: 180 }}>
                <ProgressMini value={progress} />
              </div>
            )}
            <div className="font-bold mt-2 text-sm" style={{ opacity: 0.95 }}>
              {isToday
                ? remaining > 0 ? `${remaining} chore${remaining > 1 ? 's' : ''} left` : "Everything's done!"
                : `Viewing ${formatDateLabel(viewDate)}`}
            </div>
          </div>
        ) : (
          <div
            className="grid mb-4"
            style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 6 }}
          >
            <div style={teenStat}>
              <div style={teenLbl}>TODAY</div>
              <div style={teenBig}>{doneCount}/{total} <span style={{ color: 'var(--yellow)', fontSize: 14 }}>done</span></div>
              <div style={{ marginTop: 5, height: 4, background: '#333', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--yellow)', borderRadius: 2 }} />
              </div>
            </div>
            <div style={teenStat}>
              <div style={teenLbl}>BAL</div>
              <div style={{ ...teenBig, color: 'var(--yellow)' }}>{balance}</div>
            </div>
            <div style={teenStat}>
              <div style={teenLbl}>LEFT</div>
              <div style={{ ...teenBig, color: 'var(--red)' }}>{remaining}</div>
            </div>
          </div>
        )}

        {/* Weekly Challenge */}
        {challenge && (
          <div className="mb-5">
            <WeeklyChallenge
              challenge={challenge}
              progress={challenge ? calcChallengeProgress(challenge, completions, chores, kids.map(k => k.id)) : 0}
              isParent={false}
              onSelect={selectChallenge}
            />
          </div>
        )}

        {/* Chore list */}
        <div className="stadium-eyebrow mb-2" style={isTeen ? { color: '#666' } : undefined}>
          {isTeen ? `TODAY · ${total} CHORES` : 'YOUR DUTIES'}
        </div>
        {enrichedChores.length === 0 ? (
          <div className="text-center py-12 font-bold" style={{ color: isTeen ? '#666' : 'var(--ink-50)' }}>
            No chores {isToday ? 'today' : 'this day'}. 🎉
          </div>
        ) : (
          <motion.div
            variants={list}
            initial="hidden"
            animate="show"
            key={dateStr}
            className={isTeen ? 'flex flex-col gap-1.5' : 'grid grid-cols-2 gap-3'}
          >
            {enrichedChores.map(chore => (
              <motion.div key={chore.id} variants={item}>
                <ChoreCard
                  chore={{ ...chore, status: chore._status, completed_late: chore._isLate }}
                  onComplete={handleComplete}
                  onUndo={handleUndo}
                  isPast={isPast}
                  isNew={!chore.first_completed_at}
                  skin={skin}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Reward shop strip */}
        {isToday && rewards.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="stadium-eyebrow" style={isTeen ? { color: '#666' } : undefined}>REWARD SHOP</div>
              <button
                onClick={() => navigate('/kid/shop')}
                className="font-bold text-xs"
                style={{ color: isTeen ? 'var(--yellow)' : 'var(--ink)' }}
              >
                See all →
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto scroll-hide pb-2 -mx-1 px-1">
              {rewards.slice(0, 4).map((reward: any) => (
                <div key={reward.id} className="min-w-[150px]">
                  <RewardCard reward={reward} balance={balance} onClaim={() => navigate('/kid/shop')} skin={skin} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const teenStat: React.CSSProperties = {
  background: '#1a1a1c',
  border: '1.5px solid #333',
  borderRadius: 10,
  padding: '8px 10px',
  color: '#fff',
}
const teenLbl: React.CSSProperties = {
  fontSize: 9, color: '#888', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase',
}
const teenBig: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 2,
}

function ProgressMini({ value }: { value: number }) {
  return (
    <div style={{ height: 12, background: 'rgba(0,0,0,0.25)', border: '2px solid var(--ink)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: 'var(--yellow)', transition: 'width 600ms ease-out' }} />
    </div>
  )
}

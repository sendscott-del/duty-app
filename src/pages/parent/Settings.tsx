import { useState, useRef, useEffect } from 'react'
import { useStore, type Profile } from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { SirFlush } from '../../components/ui/SirFlush'
import { AVATAR_COLORS } from '../../lib/utils'
import { getNotifPref, getNotifPermission, enableNotifications, disableNotifications } from '../../hooks/useNotifications'
import { useKidSkin, type KidSkin } from '../../hooks/useKidSkin'
import { LogOut, Plus, Pencil, Trash2, Camera, BookOpen, FileText, Bell, BellRing, Download, Copy, Sparkles, Lock } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePremium } from '../../hooks/usePremium'
import { isNativeApp } from '../../lib/platform'

const COLOR_OPTIONS = Object.keys(AVATAR_COLORS)

export function Settings() {
  const { family, kids, profile, setKids, setFamily } = useStore()
  const { signOut } = useAuth()
  const { isPremium } = usePremium()
  const [searchParams] = useSearchParams()
  const justUpgraded = searchParams.get('upgraded') === '1'

  const [showKidForm, setShowKidForm] = useState(false)
  const [editKid, setEditKid] = useState<any>(null)
  const [kidName, setKidName] = useState('')
  const [kidColor, setKidColor] = useState('purple')
  const [kidPin, setKidPin] = useState('')
  const [kidAvatarUrl, setKidAvatarUrl] = useState<string | null>(null)
  const [kidAllOrNothing, setKidAllOrNothing] = useState(false)
  const [kidBonus, setKidBonus] = useState('0')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [notifEnabled, setNotifEnabled] = useState(getNotifPref)
  const [notifPermission, setNotifPermission] = useState(getNotifPermission)

  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPrompt = useRef<any>(null)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    setIsInstalled(standalone)
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document))
    const handler = (e: Event) => { e.preventDefault(); deferredPrompt.current = e }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // After returning from Stripe checkout (?upgraded=1) the cached family is stale,
  // and the subscription webhook may land a second later. Re-fetch the family a few
  // times so Premium reflects without a manual refresh.
  useEffect(() => {
    if (!justUpgraded || !family?.id) return
    let cancelled = false
    let attempts = 0
    const poll = async () => {
      attempts++
      const { data } = await supabase.from('duty_families').select('*').eq('id', family.id).single()
      if (cancelled) return
      if (data) setFamily(data)
      if (data?.premium_status !== 'active' && attempts < 5) setTimeout(poll, 2000)
    }
    poll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justUpgraded, family?.id])

  async function toggleNotifications() {
    if (!notifEnabled) {
      if (!profile?.id || !family?.id) return
      const ok = await enableNotifications(profile.id, family.id)
      if (ok) { setNotifEnabled(true); setNotifPermission('granted') }
      else {
        setNotifPermission(getNotifPermission())
        if (getNotifPermission() === 'denied') alert('Notifications are blocked. Open browser settings to allow notifications for this site.')
      }
    } else {
      await disableNotifications()
      setNotifEnabled(false)
    }
  }

  async function handleManageSubscription() {
    if (!family?.id) return
    setPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { family_id: family.id },
      })
      if (error || !data?.url) {
        alert('Could not open subscription management. Please try again.')
        return
      }
      window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleInstall() {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt()
      const result = await deferredPrompt.current.userChoice
      if (result.outcome === 'accepted') setIsInstalled(true)
      deferredPrompt.current = null
    }
  }

  function openAddKid() {
    setEditKid(null); setKidName(''); setKidColor(COLOR_OPTIONS[kids.length % COLOR_OPTIONS.length])
    setKidPin(''); setKidAvatarUrl(null)
    setKidAllOrNothing(false); setKidBonus('0')
    setShowKidForm(true)
  }
  function openEditKid(kid: any) {
    setEditKid(kid); setKidName(kid.full_name); setKidColor(kid.avatar_color)
    setKidPin(kid.pin || ''); setKidAvatarUrl(kid.avatar_url || null)
    setKidAllOrNothing(!!kid.all_or_nothing); setKidBonus(String(kid.completion_bonus ?? 0))
    setShowKidForm(true)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const dataUrl = await resizeImage(file, 200)
      setKidAvatarUrl(dataUrl)
      if (editKid) {
        const { error } = await supabase.from('duty_profiles').update({ avatar_url: dataUrl }).eq('id', editKid.id)
        if (error) { alert('Failed to save photo. Please try again.'); setKidAvatarUrl(editKid.avatar_url || null) }
        else setKids(useStore.getState().kids.map(k => k.id === editKid.id ? { ...k, avatar_url: dataUrl } : k))
      }
    } catch { alert('Could not load photo. Please try a different image.') }
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
  }
  function resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
        else { w = Math.round(w * maxSize / h); h = maxSize }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('No canvas context')); return }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
  async function handleSaveKid() {
    if (!kidName.trim() || !family) return
    setSaving(true)
    const payoutRules = {
      all_or_nothing: kidAllOrNothing,
      completion_bonus: Math.max(0, parseInt(kidBonus, 10) || 0),
    }
    if (editKid) {
      const { error } = await supabase.from('duty_profiles').update({
        full_name: kidName.trim(), avatar_color: kidColor, avatar_url: kidAvatarUrl, pin: kidPin || null,
        ...payoutRules,
      }).eq('id', editKid.id)
      if (error) { alert('Failed to save: ' + error.message); setSaving(false); return }
      setKids(useStore.getState().kids.map(k => k.id === editKid.id
        ? { ...k, full_name: kidName.trim(), avatar_color: kidColor, avatar_url: kidAvatarUrl, pin: kidPin || null, ...payoutRules }
        : k
      ))
    } else {
      const newId = crypto.randomUUID()
      const { error } = await supabase.from('duty_profiles').insert({
        id: newId, full_name: kidName.trim(), role: 'kid',
        family_id: family.id, avatar_color: kidColor, avatar_url: kidAvatarUrl, pin: kidPin || null,
        ...payoutRules,
      })
      if (error) { alert('Failed to save: ' + error.message); setSaving(false); return }
      const newKid: Profile = {
        id: newId,
        full_name: kidName.trim(),
        role: 'kid',
        family_id: family.id,
        avatar_color: kidColor,
        avatar_url: kidAvatarUrl,
        pin: kidPin || null,
        ...payoutRules,
      }
      setKids([...useStore.getState().kids, newKid])
    }
    setSaving(false); setShowKidForm(false)
  }
  async function handleDeleteKid(kid: any) {
    if (!window.confirm(`Remove ${kid.full_name}? This can't be undone.`)) return
    await supabase.from('duty_profiles').delete().eq('id', kid.id)
    setKids(useStore.getState().kids.filter(k => k.id !== kid.id))
  }

  return (
    <div className="p-5 lg:p-8 max-w-3xl">
      <div className="stadium-eyebrow">SETTINGS</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 4, marginBottom: 18 }}>
        House rules
      </h1>

      {/* Premium status */}
      {justUpgraded && (
        <div
          style={{
            background: 'var(--green)', color: '#fff',
            border: '3px solid var(--ink)', borderRadius: 14,
            padding: 14, marginBottom: 16, boxShadow: 'var(--shadow)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <Sparkles size={20} strokeWidth={3} />
          <div>
            <div className="font-bold">Welcome to Premium!</div>
            <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Challenges, photo proofs, and full history are now unlocked.
            </div>
          </div>
        </div>
      )}

      {isPremium ? (
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} strokeWidth={3} style={{ color: 'var(--yellow)' }} />
            <div className="stadium-eyebrow">PREMIUM</div>
          </div>
          <div className="font-bold" style={{ color: 'var(--ink)' }}>Active</div>
          {family?.premium_period_end && (
            <div className="text-xs font-bold mt-1" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
              Renews {new Date(family.premium_period_end).toLocaleDateString()}
            </div>
          )}
          {!isNativeApp && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="mt-3 text-xs font-bold"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--ink)', color: 'var(--yellow)',
                border: '2px solid var(--ink)', borderRadius: 10,
                padding: '6px 12px', boxShadow: 'var(--shadow-sm)',
                cursor: portalLoading ? 'default' : 'pointer', opacity: portalLoading ? 0.7 : 1,
              }}
            >
              {portalLoading ? 'Opening…' : 'Manage subscription'}
            </button>
          )}
        </Card>
      ) : isNativeApp ? null : (
        <Link to="/parent/upgrade" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
          <div
            style={{
              background: 'var(--ink)', color: 'var(--yellow)',
              border: '3px solid var(--ink)', borderRadius: 14,
              padding: 14, boxShadow: 'var(--shadow)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}
          >
            <Lock size={16} strokeWidth={3} />
            <div className="flex-1">
              <div className="font-bold">Upgrade to Premium</div>
              <div className="text-xs font-bold" style={{ color: 'rgba(255,247,230,0.7)' }}>
                Challenges · Photo proof · Full history · $2.99/mo
              </div>
            </div>
            <div className="text-xs font-bold" style={{ background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 999, padding: '3px 8px' }}>
              UPGRADE
            </div>
          </div>
        </Link>
      )}

      {/* Family */}
      <Card>
        <div className="stadium-eyebrow mb-1">FAMILY</div>
        <div className="font-display text-2xl" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>{family?.name}</div>
      </Card>

      {/* Kid Login Link */}
      {family && (
        <Card>
          <div className="stadium-eyebrow mb-1">KID LOGIN LINK</div>
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--ink-50)' }}>
            Share this link with your kids so they can log in with their PIN.
          </p>
          <button
            onClick={() => {
              const url = `${window.location.origin}/kid-login?f=${family.id}`
              navigator.clipboard.writeText(url)
              alert('Link copied!')
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--yellow)', color: 'var(--ink)', border: '2.5px solid var(--ink)', borderRadius: 10, padding: '8px 14px', fontWeight: 800, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
          >
            <Copy size={14} strokeWidth={3} /> Copy Kid Login Link
          </button>
        </Card>
      )}

      {/* Kids */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="stadium-eyebrow">KIDS</div>
          <button
            onClick={openAddKid}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--green)', color: '#fff', border: '2.5px solid var(--ink)', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
          >
            <Plus size={12} strokeWidth={3} /> Add Kid
          </button>
        </div>
        <div className="space-y-2">
          {kids.map(kid => (
            <KidEditRow
              key={kid.id}
              kid={kid}
              onEdit={() => openEditKid(kid)}
              onDelete={() => handleDeleteKid(kid)}
            />
          ))}
          {kids.length === 0 && <div className="font-bold" style={{ color: 'var(--ink-50)' }}>No kids added yet.</div>}
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} strokeWidth={3} style={{ color: 'var(--red)' }} />
          <div className="stadium-eyebrow">NOTIFICATIONS</div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold">Push notifications</div>
            <div className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>
              Get notified when kids complete chores or request rewards
            </div>
          </div>
          <ToggleSwitch on={notifEnabled} onChange={toggleNotifications} />
        </div>
        {notifPermission === 'denied' && (
          <p className="text-xs mt-3 font-bold" style={{ color: 'var(--red)' }}>
            Notifications are blocked. Open browser/phone settings to allow notifications for this site.
          </p>
        )}
        {notifPermission === 'unsupported' && (
          <p className="text-xs mt-3 font-bold" style={{ color: 'var(--ink-50)' }}>
            Notifications aren't supported in this browser.
          </p>
        )}
      </Card>

      {/* Daily reminders (family-wide) */}
      {family && <RemindersCard familyId={family.id} />}

      {/* Install App */}
      {!isInstalled && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Download size={14} strokeWidth={3} style={{ color: 'var(--green)' }} />
            <div className="stadium-eyebrow">INSTALL APP</div>
          </div>
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--ink-50)' }}>
            Install Duty on your device for app icon badges, notifications, and fullscreen mode.
          </p>
          {deferredPrompt.current ? (
            <button
              onClick={handleInstall}
              style={{ background: 'var(--blue)', color: '#fff', border: '2.5px solid var(--ink)', borderRadius: 10, padding: '8px 14px', fontWeight: 800, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
            >
              Install Duty
            </button>
          ) : isIOS ? (
            <div style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 10, padding: 12 }}>
              <div className="font-bold mb-2">On iPhone / iPad:</div>
              <ol className="text-xs space-y-1 font-bold list-decimal list-inside" style={{ color: 'var(--ink-50)' }}>
                <li>Open this page in <strong style={{ color: 'var(--ink)' }}>Safari</strong> (not Chrome)</li>
                <li>Tap the <strong style={{ color: 'var(--ink)' }}>Share</strong> button</li>
                <li>Scroll down and tap <strong style={{ color: 'var(--ink)' }}>Add to Home Screen</strong></li>
                <li>Tap <strong style={{ color: 'var(--ink)' }}>Add</strong></li>
              </ol>
            </div>
          ) : (
            <div style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 10, padding: 12 }}>
              <div className="font-bold mb-2">On Desktop (Chrome / Edge):</div>
              <ol className="text-xs space-y-1 font-bold list-decimal list-inside" style={{ color: 'var(--ink-50)' }}>
                <li>Click the <strong style={{ color: 'var(--ink)' }}>install icon</strong> in the address bar</li>
                <li>Click <strong style={{ color: 'var(--ink)' }}>Install</strong></li>
              </ol>
            </div>
          )}
        </Card>
      )}

      {/* Help & Info */}
      <Card>
        <div className="stadium-eyebrow mb-3">HELP & INFO</div>
        <div className="space-y-2">
          <Link to="/parent/guide" className="flex items-center gap-3 p-2" style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 10 }}>
            <BookOpen size={16} strokeWidth={3} style={{ color: 'var(--ink)' }} />
            <span className="font-bold">User Guide</span>
          </Link>
          <Link to="/parent/release-notes" className="flex items-center gap-3 p-2" style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 10 }}>
            <FileText size={16} strokeWidth={3} style={{ color: 'var(--ink)' }} />
            <div>
              <div className="font-bold">Release Notes</div>
              <div className="text-xs font-bold" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>v1.4.0</div>
            </div>
          </Link>
        </div>
      </Card>

      <div className="my-6">
        <SirFlush size={64} expression="happy" />
      </div>

      <Button variant="primary" fullWidth onClick={async () => { await signOut(); window.location.href = '/login' }}>
        <LogOut size={16} strokeWidth={3} /> SIGN OUT
      </Button>

      {/* Add/Edit Kid Modal */}
      <Modal open={showKidForm} onClose={() => setShowKidForm(false)} title={editKid ? 'Edit Kid' : 'Add Kid'}>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar name={kidName || '?'} color={kidColor} avatarUrl={kidAvatarUrl} size="xl" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--yellow)', color: 'var(--ink)',
                  border: '2.5px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                }}
              >
                <Camera size={14} strokeWidth={3} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" className="hidden" onChange={handleAvatarUpload} />
            {uploading && <span className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>Uploading…</span>}
          </div>

          <Input label="Name" value={kidName} onChange={e => setKidName(e.target.value)} placeholder="e.g. Olivia" />
          <Input label="4-digit PIN" value={kidPin} onChange={e => setKidPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} />

          <div>
            <label className="stadium-eyebrow block mb-2">COLOR</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setKidColor(c)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: AVATAR_COLORS[c].bg,
                    border: kidColor === c ? '3px solid var(--ink)' : '2px solid var(--ink)',
                    boxShadow: kidColor === c ? 'var(--shadow-sm)' : 'none',
                    transform: kidColor === c ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 120ms',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ borderTop: '2px dashed var(--ink-15)', paddingTop: 14 }}>
            <div className="stadium-eyebrow mb-2">CHORE PAYOUT</div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--ink)' }}>All or nothing</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--ink-50)' }}>
                  No points until every chore for the day is approved — then the whole day pays at once.
                  Stops them cherry-picking the easy ones.
                </div>
              </div>
              <ToggleSwitch on={kidAllOrNothing} onChange={() => setKidAllOrNothing(v => !v)} />
            </div>

            <div className="mt-3">
              <Input
                label="Completion bonus (points)"
                type="number"
                inputMode="numeric"
                min={0}
                value={kidBonus}
                onChange={e => setKidBonus(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0"
              />
              <div className="text-xs font-bold mt-1" style={{ color: 'var(--ink-50)' }}>
                Extra points on top for finishing everything that day. 0 for none.
              </div>
            </div>

            {kidAllOrNothing && (
              <div
                className="text-xs font-bold mt-3"
                style={{ background: 'var(--yellow)', color: 'var(--ink)', border: '2px solid var(--ink)', borderRadius: 10, padding: '8px 10px' }}
              >
                Heads up: on a day they miss even one chore, they earn nothing. Late chores still
                count as done (they just don't pay on their own).
              </div>
            )}
          </div>

          <Button fullWidth onClick={handleSaveKid} loading={saving} disabled={!kidName.trim()}>
            {editKid ? 'Save Changes' : 'Add Kid'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function RemindersCard({ familyId }: { familyId: string }) {
  const [enabled, setEnabled] = useState(true)
  const [time, setTime] = useState('18:00')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('duty_families')
      .select('reminder_time, reminders_enabled')
      .eq('id', familyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setEnabled(!!data.reminders_enabled)
          // Stored as HH:MM:SS — strip seconds for the time input.
          setTime((data.reminder_time as string).slice(0, 5))
        }
        setLoaded(true)
      })
  }, [familyId])

  async function save(next: { enabled?: boolean; time?: string }) {
    const newEnabled = next.enabled ?? enabled
    const newTime = next.time ?? time
    setSaving(true)
    if (next.enabled !== undefined) setEnabled(newEnabled)
    if (next.time !== undefined) setTime(newTime)
    await supabase
      .from('duty_families')
      .update({ reminders_enabled: newEnabled, reminder_time: newTime })
      .eq('id', familyId)
    setSaving(false)
  }

  if (!loaded) return null

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <BellRing size={14} strokeWidth={3} style={{ color: 'var(--blue)' }} />
        <div className="stadium-eyebrow">DAILY REMINDERS</div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold">Send daily reminder push</div>
          <div className="text-xs font-bold" style={{ color: 'var(--ink-50)' }}>
            Pings any kid with chores left + a summary to parents. Skips when everyone's done.
          </div>
        </div>
        <ToggleSwitch on={enabled} onChange={() => save({ enabled: !enabled })} />
      </div>
      <div className="flex items-center justify-between" style={{ opacity: enabled ? 1 : 0.4 }}>
        <div>
          <div className="font-bold">Reminder time</div>
          <div className="text-xs font-bold" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
            Local Chicago time
          </div>
        </div>
        <input
          type="time"
          value={time}
          disabled={!enabled || saving}
          onChange={(e) => save({ time: e.target.value })}
          style={{
            background: '#fff',
            color: 'var(--ink)',
            border: '2.5px solid var(--ink)',
            borderRadius: 10,
            padding: '6px 10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 14,
            boxShadow: 'var(--shadow-sm)',
          }}
        />
      </div>
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4"
      style={{
        background: '#fff',
        border: '2.5px solid var(--ink)',
        borderRadius: 14,
        padding: 16,
        boxShadow: 'var(--shadow-sm)',
        color: 'var(--ink)',
      }}
    >
      {children}
    </div>
  )
}

function ToggleSwitch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        position: 'relative', width: 50, height: 28,
        borderRadius: 14,
        background: on ? 'var(--green)' : '#fff',
        border: '2.5px solid var(--ink)',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute', top: 1, left: on ? 22 : 1,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff',
          border: '2px solid var(--ink)',
          transition: 'left 160ms',
        }}
      />
    </button>
  )
}

function KidEditRow({ kid, onEdit, onDelete }: { kid: any; onEdit: () => void; onDelete: () => void }) {
  const [skin, setSkin] = useKidSkin(kid.id)

  return (
    <div style={{ background: 'var(--cream)', border: '2.5px solid var(--ink)', borderRadius: 12, padding: 12 }}>
      <div className="flex items-center gap-3">
        <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} />
        <div className="flex-1 min-w-0">
          <div className="font-bold">{kid.full_name}</div>
          <div className="text-xs font-bold" style={{ color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
            PIN: {kid.pin || 'Not set'}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} style={{ background: '#fff', border: '2px solid var(--ink)', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
            <Pencil size={13} strokeWidth={3} />
          </button>
          <button onClick={onDelete} style={{ background: 'var(--red)', color: '#fff', border: '2px solid var(--ink)', borderRadius: 8, padding: 6, cursor: 'pointer' }}>
            <Trash2 size={13} strokeWidth={3} />
          </button>
        </div>
      </div>
      <div className="mt-3">
        <div className="stadium-eyebrow mb-1.5">VIBE</div>
        <div className="flex gap-2">
          <SkinPill active={skin === 'younger'} onClick={() => setSkin('younger')}>Younger · 8–10</SkinPill>
          <SkinPill active={skin === 'teen'} onClick={() => setSkin('teen')}>Teen · 11+</SkinPill>
        </div>
      </div>
    </div>
  )
}

function SkinPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? 'var(--yellow)' : '#fff',
        color: 'var(--ink)',
        border: '2px solid var(--ink)',
        borderRadius: 999,
        padding: '5px 12px',
        fontSize: 12,
        fontWeight: 800,
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// Skin type re-export to keep compiler quiet
export type { KidSkin }

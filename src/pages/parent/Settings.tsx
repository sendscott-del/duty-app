import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../lib/store'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { AVATAR_COLORS } from '../../lib/utils'
import { getNotifPref, setNotifPref, requestNotifPermission, getNotifPermission } from '../../hooks/useNotifications'
import { LogOut, Plus, Pencil, Trash2, Camera, BookOpen, FileText, Bell, Download } from 'lucide-react'
import { Link } from 'react-router-dom'

const COLOR_OPTIONS = Object.keys(AVATAR_COLORS)

export function Settings() {
  const { family, kids, profile } = useStore()
  const { signOut, loadProfile } = useAuth()

  const [showKidForm, setShowKidForm] = useState(false)
  const [editKid, setEditKid] = useState<any>(null)
  const [kidName, setKidName] = useState('')
  const [kidColor, setKidColor] = useState('purple')
  const [kidPin, setKidPin] = useState('')
  const [kidAvatarUrl, setKidAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Notification state
  const [notifEnabled, setNotifEnabled] = useState(getNotifPref)
  const [notifPermission, setNotifPermission] = useState(getNotifPermission)

  // PWA install detection
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPrompt = useRef<any>(null)

  useEffect(() => {
    // Check if running as installed PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    setIsInstalled(standalone)

    // Detect iOS
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document))

    // Capture install prompt for Android/Chrome
    const handler = (e: Event) => { e.preventDefault(); deferredPrompt.current = e }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function toggleNotifications() {
    if (!notifEnabled) {
      const granted = await requestNotifPermission()
      if (granted) {
        setNotifPref(true)
        setNotifEnabled(true)
        setNotifPermission('granted')
      } else {
        setNotifPermission(getNotifPermission())
        if (getNotifPermission() === 'denied') {
          alert('Notifications are blocked. Go to your browser settings to allow notifications for this site.')
        }
      }
    } else {
      setNotifPref(false)
      setNotifEnabled(false)
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
    setEditKid(null)
    setKidName('')
    setKidColor(COLOR_OPTIONS[kids.length % COLOR_OPTIONS.length])
    setKidPin('')
    setKidAvatarUrl(null)
    setShowKidForm(true)
  }

  function openEditKid(kid: any) {
    setEditKid(kid)
    setKidName(kid.full_name)
    setKidColor(kid.avatar_color)
    setKidPin(kid.pin || '')
    setKidAvatarUrl(kid.avatar_url || null)
    setShowKidForm(true)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      const dataUrl = await resizeImage(file, 200)
      setKidAvatarUrl(dataUrl)
    } catch (err) {
      alert('Could not load photo. Please try a different image.')
    }
    // Reset input so selecting the same file again triggers onChange
    if (fileRef.current) fileRef.current.value = ''
    setUploading(false)
  }

  function resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize }
        else { w = Math.round(w * maxSize / h); h = maxSize }
        canvas.width = w
        canvas.height = h
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

    if (editKid) {
      await supabase.from('duty_profiles').update({
        full_name: kidName.trim(),
        avatar_color: kidColor,
        avatar_url: kidAvatarUrl,
        pin: kidPin || null,
      }).eq('id', editKid.id)
    } else {
      await supabase.from('duty_profiles').insert({
        id: crypto.randomUUID(),
        full_name: kidName.trim(),
        role: 'kid',
        family_id: family.id,
        avatar_color: kidColor,
        avatar_url: kidAvatarUrl,
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
              <Avatar name={kid.full_name} color={kid.avatar_color} avatarUrl={kid.avatar_url} />
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

      {/* Notifications */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} style={{ color: 'var(--gold)' }} />
          <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--p-dim)' }}>Notifications</div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm" style={{ color: 'var(--p-text)' }}>Push notifications</div>
            <div className="text-[11px]" style={{ color: 'var(--p-muted)' }}>
              Get notified when kids complete chores or request rewards
            </div>
          </div>
          <button
            onClick={toggleNotifications}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: notifEnabled ? 'var(--gold)' : 'var(--p-border)' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: notifEnabled ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
        {notifPermission === 'denied' && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--red)' }}>
            Notifications are blocked. Open your browser/phone settings to allow notifications for this site.
          </p>
        )}
        {notifPermission === 'unsupported' && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--p-muted)' }}>
            Notifications aren't supported in this browser.
          </p>
        )}
        {notifEnabled && (
          <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--p-border)' }}>
            <div className="text-[11px]" style={{ color: 'var(--p-dim)' }}>You'll be notified when:</div>
            <div className="text-[11px]" style={{ color: 'var(--p-muted)' }}>- A kid marks a chore as done (needs approval)</div>
            <div className="text-[11px]" style={{ color: 'var(--p-muted)' }}>- A kid requests a reward</div>
            <div className="text-[11px]" style={{ color: 'var(--p-muted)' }}>- App icon badge shows pending count</div>
          </div>
        )}
      </div>

      {/* Install App */}
      {!isInstalled && (
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Download size={14} style={{ color: 'var(--gold)' }} />
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--p-dim)' }}>Install App</div>
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--p-muted)' }}>
            Install Duty on your device for the best experience — app icon badges, notifications, and fullscreen mode.
          </p>
          {deferredPrompt.current ? (
            <button
              onClick={handleInstall}
              className="text-sm font-medium px-3 py-2 rounded-lg"
              style={{ background: 'var(--gold-dim)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
            >
              Install Duty
            </button>
          ) : isIOS ? (
            <div className="rounded-lg p-3" style={{ background: 'var(--p-bg)', border: '1px solid var(--p-border)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--p-text)' }}>On iPhone / iPad:</div>
              <ol className="text-[11px] space-y-1.5" style={{ color: 'var(--p-muted)' }}>
                <li>1. Open this page in <strong style={{ color: 'var(--p-text)' }}>Safari</strong> (not Chrome)</li>
                <li>2. Tap the <strong style={{ color: 'var(--p-text)' }}>Share</strong> button (square with arrow at bottom)</li>
                <li>3. Scroll down and tap <strong style={{ color: 'var(--p-text)' }}>Add to Home Screen</strong></li>
                <li>4. Tap <strong style={{ color: 'var(--p-text)' }}>Add</strong></li>
              </ol>
              <p className="text-[10px] mt-2" style={{ color: 'var(--p-dim)' }}>
                This gives you app icon badges, notifications, and fullscreen mode.
              </p>
            </div>
          ) : (
            <div className="rounded-lg p-3" style={{ background: 'var(--p-bg)', border: '1px solid var(--p-border)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--p-text)' }}>On Desktop (Chrome / Edge):</div>
              <ol className="text-[11px] space-y-1.5" style={{ color: 'var(--p-muted)' }}>
                <li>1. Click the <strong style={{ color: 'var(--p-text)' }}>install icon</strong> in the address bar (or the three-dot menu)</li>
                <li>2. Click <strong style={{ color: 'var(--p-text)' }}>Install</strong></li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Help & Info */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--p-card)', border: '1px solid var(--p-border)' }}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--p-dim)' }}>Help & Info</div>
        <div className="space-y-2">
          <Link
            to="/parent/guide"
            className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            <BookOpen size={16} style={{ color: 'var(--gold)' }} />
            <span className="text-sm" style={{ color: 'var(--p-text)' }}>User Guide</span>
          </Link>
          <Link
            to="/parent/release-notes"
            className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/[0.03]"
          >
            <FileText size={16} style={{ color: 'var(--gold)' }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--p-text)' }}>Release Notes</div>
              <div className="text-[11px]" style={{ color: 'var(--p-dim)' }}>v1.2.5</div>
            </div>
          </Link>
        </div>
      </div>

      <Button variant="red" fullWidth onClick={async () => { await signOut(); window.location.href = '/login' }}>
        <LogOut size={16} /> Sign Out
      </Button>

      {/* Add/Edit Kid Modal */}
      <Modal open={showKidForm} onClose={() => setShowKidForm(false)} title={editKid ? 'Edit Kid' : 'Add Kid'}>
        <div className="space-y-4">
          {/* Profile pic */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar name={kidName || '?'} color={kidColor} avatarUrl={kidAvatarUrl} size="lg" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'var(--gold)', color: '#000' }}
                disabled={uploading}
              >
                <Camera size={12} />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" className="hidden" onChange={handleAvatarUpload} />
            {uploading && <span className="text-[10px]" style={{ color: 'var(--p-muted)' }}>Uploading...</span>}
          </div>

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

import { useEffect, useState } from 'react'

export type KidSkin = 'younger' | 'teen'

const KEY = 'duty.kidSkin.v1'

function readMap(): Record<string, KidSkin> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, KidSkin>
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, KidSkin>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('duty.kidSkin.change'))
  } catch {}
}

export function getKidSkin(kidId: string | undefined | null, fallback: KidSkin = 'younger'): KidSkin {
  if (!kidId) return fallback
  const map = readMap()
  return map[kidId] ?? fallback
}

export function setKidSkin(kidId: string, skin: KidSkin) {
  const map = readMap()
  map[kidId] = skin
  writeMap(map)
}

/** Per-kid skin, reactive to changes from anywhere. */
export function useKidSkin(kidId: string | undefined | null, fallback: KidSkin = 'younger'): [KidSkin, (s: KidSkin) => void] {
  const [skin, setSkin] = useState<KidSkin>(() => getKidSkin(kidId, fallback))

  useEffect(() => {
    setSkin(getKidSkin(kidId, fallback))
    const handler = () => setSkin(getKidSkin(kidId, fallback))
    window.addEventListener('storage', handler)
    window.addEventListener('duty.kidSkin.change', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('duty.kidSkin.change', handler)
    }
  }, [kidId, fallback])

  function update(next: KidSkin) {
    if (!kidId) return
    setKidSkin(kidId, next)
    setSkin(next)
  }

  return [skin, update]
}

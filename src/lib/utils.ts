export const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  purple: { bg: 'rgba(139,92,246,0.2)', text: '#a78bfa' },
  green:  { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  gold:   { bg: 'rgba(245,200,66,0.15)', text: '#F5C842' },
  coral:  { bg: 'rgba(251,113,133,0.2)', text: '#fb7185' },
  blue:   { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  orange: { bg: 'rgba(251,146,60,0.2)', text: '#fb923c' },
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatPoints(n: number): string {
  return n.toLocaleString()
}

export function useIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
}

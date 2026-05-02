import { AVATAR_COLORS, getInitials } from '../../lib/utils'

const SIZES = {
  sm: { wh: 28, fs: 11 },
  md: { wh: 40, fs: 14 },
  lg: { wh: 56, fs: 18 },
  xl: { wh: 80, fs: 28 },
} as const

interface AvatarProps {
  name: string
  color?: string
  avatarUrl?: string | null
  size?: keyof typeof SIZES
}

export function Avatar({ name, color = 'purple', avatarUrl, size = 'md' }: AvatarProps) {
  const c = AVATAR_COLORS[color] ?? AVATAR_COLORS.purple
  const s = SIZES[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: s.wh,
          height: s.wh,
          borderRadius: '50%',
          border: '2.5px solid var(--ink)',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: s.wh,
        height: s.wh,
        borderRadius: '50%',
        border: '2.5px solid var(--ink)',
        background: c.bg,
        color: c.text,
        fontWeight: 800,
        fontSize: s.fs,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  )
}

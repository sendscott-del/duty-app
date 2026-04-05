import { AVATAR_COLORS, getInitials } from '../../lib/utils'

const SIZES = { sm: 'w-6 h-6 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-12 h-12 text-sm' }

export function Avatar({ name, color = 'purple', size = 'md' }: { name: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = AVATAR_COLORS[color] ?? AVATAR_COLORS.purple
  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center font-medium shrink-0`}
      style={{ background: c.bg, color: c.text }}
    >
      {getInitials(name)}
    </div>
  )
}

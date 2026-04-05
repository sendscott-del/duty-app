import { motion } from 'framer-motion'

const VARIANTS: Record<string, string> = {
  gold: 'bg-[var(--gold)] text-black hover:brightness-110',
  ghost: 'text-[var(--p-muted)] hover:text-[var(--p-text)] hover:bg-[var(--p-card)]',
  outline: 'border border-[var(--p-border)] text-[var(--p-text)] hover:bg-[var(--p-card)]',
  green: 'bg-[var(--green)] text-black hover:brightness-110',
  red: 'bg-[var(--red)] text-black hover:brightness-110',
  muted: 'bg-[var(--p-card)] text-[var(--p-muted)] hover:text-[var(--p-text)]',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS
  fullWidth?: boolean
  loading?: boolean
}

export function Button({ variant = 'gold', fullWidth, loading, children, className = '', ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
        transition-all min-h-[44px] disabled:opacity-40 disabled:pointer-events-none
        ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
      disabled={loading || props.disabled}
      {...(props as any)}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
}

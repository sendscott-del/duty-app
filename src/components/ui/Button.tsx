import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'green' | 'red' | 'ghost' | 'dark' | 'gold' | 'muted' | 'outline'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
}

const STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--red)',
    color: '#fff',
    border: '3px solid var(--ink)',
    boxShadow: 'var(--shadow)',
    textShadow: '2px 2px 0 var(--ink)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
  },
  secondary: {
    background: 'var(--cream)',
    color: 'var(--ink)',
    border: '3px solid var(--ink)',
    boxShadow: 'var(--shadow-sm)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
  },
  tertiary: {
    background: '#fff',
    color: 'var(--ink)',
    border: '2.5px solid var(--ink)',
    fontWeight: 800,
  },
  green: {
    background: 'var(--green)',
    color: '#fff',
    border: '3px solid var(--ink)',
    boxShadow: 'var(--shadow)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
    textShadow: '2px 2px 0 var(--ink)',
  },
  red: {
    background: 'var(--red)',
    color: '#fff',
    border: '3px solid var(--ink)',
    boxShadow: 'var(--shadow)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
    textShadow: '2px 2px 0 var(--ink)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '2.5px solid transparent',
    fontWeight: 700,
  },
  dark: {
    background: 'var(--ink)',
    color: '#fff',
    border: '3px solid var(--ink)',
    boxShadow: 'var(--shadow-sm)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
  },
  // Legacy aliases
  gold: {
    background: 'var(--yellow)',
    color: 'var(--ink)',
    border: '3px solid var(--ink)',
    boxShadow: 'var(--shadow-sm)',
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em',
  },
  muted: {
    background: '#fff',
    color: 'var(--ink)',
    border: '2.5px solid var(--ink)',
    fontWeight: 800,
  },
  outline: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '2.5px solid var(--ink)',
    fontWeight: 800,
  },
}

export function Button({ variant = 'primary', fullWidth, loading, children, className = '', style, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96, boxShadow: '1px 1px 0 var(--ink)' }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={`
        inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-base
        transition-[background,color] min-h-[48px]
        disabled:opacity-50 disabled:pointer-events-none
        ${fullWidth ? 'w-full' : ''} ${className}
      `}
      disabled={loading || props.disabled}
      style={{ ...STYLES[variant], ...style }}
      {...(props as any)}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  )
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
}

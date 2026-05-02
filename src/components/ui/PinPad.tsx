import { Delete } from 'lucide-react'

interface PinPadProps {
  value: string
  length?: number
  error?: boolean
  onChange: (val: string) => void
  light?: boolean // light pad on dark background
}

export function PinPad({ value, length = 4, error, onChange, light }: PinPadProps) {
  const dots = Array.from({ length }, (_, i) => i < value.length)
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  const fg = light ? 'var(--cream)' : 'var(--ink)'
  const keyBg = light ? 'var(--cream)' : '#fff'
  const keyText = 'var(--ink)'

  function press(k: string) {
    if (k === 'del') return onChange(value.slice(0, -1))
    if (!k) return
    if (value.length >= length) return
    onChange(value + k)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dots */}
      <div className="flex gap-3">
        {dots.map((filled, i) => (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: filled ? 'var(--yellow)' : 'transparent',
              border: '3px solid var(--ink)',
              boxShadow: filled ? 'var(--shadow-sm)' : 'none',
              transition: 'background 120ms, transform 120ms',
              transform: filled ? 'scale(1.05)' : 'scale(1)',
              outline: error ? '3px solid var(--red)' : undefined,
              outlineOffset: error ? 4 : undefined,
            }}
          />
        ))}
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-3" style={{ width: 'min(280px, 80vw)' }}>
        {keys.map((k, i) => {
          if (k === '') return <div key={i} />
          if (k === 'del') {
            return (
              <button
                key={i}
                onClick={() => press('del')}
                aria-label="Backspace"
                style={{
                  height: 64,
                  background: 'transparent',
                  color: light ? 'rgba(255,247,230,0.7)' : 'rgba(26,20,17,0.6)',
                  border: 'none',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Delete size={26} />
              </button>
            )
          }
          return (
            <button
              key={i}
              onClick={() => press(k)}
              style={{
                height: 64,
                background: keyBg,
                color: keyText,
                border: '3px solid var(--ink)',
                borderRadius: 14,
                boxShadow: 'var(--shadow)',
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              onMouseDown={(e) => { e.currentTarget.style.boxShadow = '1px 1px 0 var(--ink)'; e.currentTarget.style.transform = 'translate(2px, 2px)' }}
              onMouseUp={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = '' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = '' }}
            >
              {k}
            </button>
          )
        })}
      </div>
      {fg /* unused but keeps typescript happy if dead-code elimination runs */ && null}
    </div>
  )
}

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(26,20,17,0.55)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed z-50 inset-x-0 bottom-0 lg:inset-0 lg:flex lg:items-center lg:justify-center"
          >
            <motion.div
              className="w-full lg:max-w-lg overflow-y-auto"
              style={{
                background: 'var(--cream)',
                border: '3px solid var(--ink)',
                borderBottom: 'none',
                borderTopLeftRadius: 'var(--r-2xl)',
                borderTopRightRadius: 'var(--r-2xl)',
                maxHeight: 'min(85dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 16px))',
              }}
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div
                  className="flex items-center justify-between sticky top-0 z-10"
                  style={{
                    background: 'var(--cream)',
                    borderBottom: '2.5px solid var(--ink)',
                    padding: '14px 18px 12px',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.03em' }}>{title}</h3>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                      width: 32, height: 32,
                      borderRadius: 8,
                      border: '2.5px solid var(--ink)',
                      background: '#fff',
                      color: 'var(--ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              )}
              <div className="px-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', paddingTop: 14 }}>
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

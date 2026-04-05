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
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Mobile: bottom sheet. Desktop: centered modal */}
          <motion.div
            className="fixed z-50 inset-x-0 bottom-0 lg:inset-0 lg:flex lg:items-center lg:justify-center"
          >
            <motion.div
              className="bg-[var(--p-surface)] rounded-t-2xl lg:rounded-2xl w-full lg:max-w-lg max-h-[85vh] overflow-y-auto border-t border-[var(--p-border)] lg:border"
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <h3 className="text-base font-medium" style={{ color: 'var(--p-text)' }}>{title}</h3>
                  <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--p-card)]" style={{ color: 'var(--p-muted)' }}>
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="px-5 pb-5">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

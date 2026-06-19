import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface-raised rounded-t-2xl shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-overlay">
            <span className="font-semibold text-sm text-white">{title}</span>
            <button onClick={onClose} className="text-white/40 text-lg leading-none p-1">✕</button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[60vh]">
          {children}
        </div>
      </div>
    </>
  )
}

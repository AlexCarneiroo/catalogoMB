import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/format'

type Tone = 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  tone: Tone
  bump: number
}

type ToastContextValue = {
  notify: (message: string, tone?: Tone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message: string, tone: Tone = 'success') => {
    const text = message.trim()
    if (!text) return
    setToasts((current) => {
      const existing = current.find((toast) => toast.message === text && toast.tone === tone)
      if (existing) return current.map((toast) => (toast.id === existing.id ? { ...toast, bump: toast.bump + 1 } : toast))
      idRef.current += 1
      return [...current.slice(-3), { id: idRef.current, message: text, tone, bump: 0 }]
    })
  }, [])

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dismiss(toast.id), 4200))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [toasts, dismiss])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 z-[140] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'toast-in pointer-events-auto flex items-start gap-3 border bg-white px-4 py-3 shadow-soft',
              toast.tone === 'error' ? 'border-rose' : 'border-gold',
            )}
          >
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', toast.tone === 'error' ? 'bg-rose' : 'bg-gold')} />
            <p className="flex-1 text-sm leading-relaxed text-plum">{toast.message}</p>
            <button type="button" className="text-[10px] tracking-[0.14em] text-muted uppercase" onClick={() => dismiss(toast.id)}>
              Fechar
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider')
  return context
}

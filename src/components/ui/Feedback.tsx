import type { ReactNode } from 'react'
import { cn } from '@/utils/format'

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5 md:px-8', className)}>{children}</div>
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-plum/10', className)} />
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'success'; children: ReactNode }) {
  return (
    <p className={cn('px-4 py-3 text-sm', tone === 'error' ? 'bg-rose-soft text-plum' : 'bg-lilac-soft text-plum')} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white/70 px-6 py-16 text-center shadow-soft">
      <div className="pointer-events-none absolute -top-8 right-6 h-24 w-24 rounded-full bg-rose/50 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-8 h-16 w-16 rounded-full bg-lilac/40 blur-2xl" />
      <h2 className="relative font-serif text-4xl text-plum italic">{title}</h2>
      <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}

export function Spinner({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="grid min-h-[40vh] place-items-center text-plum" role="status">
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border border-gold border-t-transparent" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.22em]">{label}</p>
      </div>
    </div>
  )
}

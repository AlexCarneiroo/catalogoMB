import { useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

type ModalProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-plum-deep/50 px-4 py-8" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto bg-ivory p-6 shadow-soft md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-serif text-3xl text-plum">{title}</h2>
          <Button variant="ghost" className="px-3 py-2" onClick={onClose} aria-label="Fechar">
            Fechar
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

type ConfirmProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Excluir', busy = false, onConfirm, onClose }: ConfirmProps) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-8 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Aguarde' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

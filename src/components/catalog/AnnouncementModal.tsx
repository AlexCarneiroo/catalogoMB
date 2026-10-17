import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/contexts/StoreContext'
import { buttonClass } from '@/components/ui/Button'

const storageKey = 'mabelle-announcement'

export function AnnouncementModal() {
  const { settings } = useStore()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!settings.announcementActive || !settings.announcementText.trim()) {
      setOpen(false)
      return
    }
    const seen = localStorage.getItem(storageKey)
    setOpen(seen !== String(settings.announcementVersion))
  }, [settings.announcementActive, settings.announcementText, settings.announcementVersion])

  function close() {
    localStorage.setItem(storageKey, String(settings.announcementVersion))
    setOpen(false)
  }

  if (!open) return null

  const link = settings.announcementLink || '/produtos'

  return (
    <div data-scroll-lock="" className="fixed inset-0 z-[85] grid place-items-center bg-plum-deep/45 px-4 backdrop-blur-[3px]" role="presentation" onClick={close}>
      <div role="dialog" aria-modal="true" aria-label={settings.announcementTitle || 'Anúncio'} className="sheet-in max-h-[min(88dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-ivory p-6 shadow-soft sm:p-8" onClick={(event) => event.stopPropagation()}>
        <p className="text-[11px] tracking-[0.28em] text-gold-deep uppercase">Novidade da casa</p>
        <h2 className="display mt-3 text-5xl text-plum">{settings.announcementTitle || 'Uma nota da casa'}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">{settings.announcementText}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {link.startsWith('/') ? (
            <Link to={link} className={buttonClass('primary')} onClick={close}>
              {settings.announcementButtonText || 'Ver'}
            </Link>
          ) : (
            <a href={link} className={buttonClass('primary')} onClick={close}>
              {settings.announcementButtonText || 'Ver'}
            </a>
          )}
          <button type="button" className={buttonClass('ghost')} onClick={close}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

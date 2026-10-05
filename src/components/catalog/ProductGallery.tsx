import { useEffect, useState, type UIEvent } from 'react'
import type { ProductImage } from '@/types/models'
import { cn } from '@/utils/format'

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const photos = images.length > 0 ? images : []
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const current = photos[index] ?? photos[0]

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % photos.length)
      if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, photos.length])

  if (!current) {
    return <div className="grid aspect-[3/4] place-items-center bg-ivory-deep text-sm text-muted">Sem fotos</div>
  }

  function onScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget
    const width = element.clientWidth || 1
    setIndex(Math.round(element.scrollLeft / width))
  }

  return (
    <div>
      <div className="md:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto" onScroll={onScroll}>
          {photos.map((photo, photoIndex) => (
            <button key={`${photo.url}-${photoIndex}`} type="button" className="w-full shrink-0 snap-center" onClick={() => setOpen(true)}>
              <img src={photo.url} alt={`${name} ${photoIndex + 1}`} className="aspect-[3/4] w-full rounded-[1.6rem] object-cover" />
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] tracking-[0.18em] text-muted">
          {index + 1} / {photos.length}
        </p>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-[88px_1fr]">
        <div className="flex flex-col gap-3">
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo.url}-${photoIndex}`}
              type="button"
              onClick={() => setIndex(photoIndex)}
              className={cn('overflow-hidden border', photoIndex === index ? 'border-gold' : 'border-transparent')}
            >
              <img src={photo.url} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setOpen(true)} className="overflow-hidden rounded-[1.8rem] bg-ivory-deep shadow-soft">
          <img src={current.url} alt={name} className="aspect-[3/4] w-full object-cover transition duration-700 hover:scale-[1.02]" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-plum-deep/92 p-4" role="dialog" aria-modal="true" aria-label="Foto ampliada">
          <button type="button" className="absolute top-5 right-5 text-[11px] uppercase tracking-[0.18em] text-ivory" onClick={() => setOpen(false)}>
            Fechar
          </button>
          {photos.length > 1 ? (
            <>
              <button type="button" className="absolute top-1/2 left-4 -translate-y-1/2 text-ivory" onClick={() => setIndex((value) => (value - 1 + photos.length) % photos.length)} aria-label="Foto anterior">
                ←
              </button>
              <button type="button" className="absolute top-1/2 right-4 -translate-y-1/2 text-ivory" onClick={() => setIndex((value) => (value + 1) % photos.length)} aria-label="Próxima foto">
                →
              </button>
            </>
          ) : null}
          <img src={current.url} alt={name} className="max-h-[86vh] max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  )
}

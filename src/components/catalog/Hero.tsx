import { useEffect, useState } from 'react'
import { SmartLink } from '@/components/catalog/SmartLink'
import { ButtonLink, buttonClass } from '@/components/ui/Button'
import type { Banner } from '@/types/models'
import { cn } from '@/utils/format'

const fallback = {
  title: 'Realce sua beleza.',
  subtitle: 'Produtos selecionados para transformar sua rotina.',
  buttonText: 'Ver catálogo',
  link: '/produtos',
  image: '',
}

function splitTitle(title: string) {
  const clean = title.trim()
  const words = clean.split(/\s+/)
  if (words.length < 2) return { lead: clean, accent: '' }
  const accent = words.pop() ?? ''
  return { lead: words.join(' '), accent }
}

export function Hero({ banners }: { banners: Banner[] }) {
  const slides = banners.length > 0 ? banners : [fallback]
  const [index, setIndex] = useState(0)
  const slide = slides[index] ?? slides[0]

  useEffect(() => {
    if (slides.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (!slide) return null
  const title = splitTitle(slide.title || fallback.title)

  return (
    <section className="relative overflow-hidden px-5 pt-28 pb-8 md:px-8 md:pt-32">
      <div className="pointer-events-none absolute top-16 -left-16 h-56 w-56 rounded-full bg-rose/50 blur-3xl drift" />
      <div className="pointer-events-none absolute top-28 right-[18%] h-40 w-40 rounded-full bg-lilac/40 blur-3xl drift" style={{ animationDelay: '-4s' }} />
      <div className="mx-auto grid min-h-[78svh] max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div key={`${slide.title}-${index}`} className="rise relative z-10">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">
            <span className="draw-line inline-block h-px w-12 bg-gold" />
            Coleção
          </p>
          <h1 className="display mt-6 max-w-3xl text-6xl text-plum md:text-8xl">
            {title.lead}{' '}
            {title.accent ? <span className="italic text-rose">{title.accent}</span> : null}
          </h1>
          {slide.subtitle ? (
            <p className="rise-delay mt-7 max-w-md text-lg leading-relaxed text-muted">{slide.subtitle}</p>
          ) : null}
          <div className="rise-delay mt-9">
            {'id' in slide ? (
              <SmartLink to={slide.link || '/produtos'} className={buttonClass('primary')}>
                {slide.buttonText || 'Ver produtos'}
              </SmartLink>
            ) : (
              <ButtonLink to="/produtos">Ver catálogo</ButtonLink>
            )}
          </div>
        </div>

        <div className="relative mx-auto h-[68vw] max-h-[560px] w-full max-w-md lg:h-[560px]">
          <div className="absolute -top-6 -left-6 h-28 w-28 rounded-full border border-gold/70" />
          <div className="float-frame absolute inset-6 overflow-hidden rounded-[2.4rem] bg-plum shadow-soft">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(216,164,182,0.9),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(201,168,106,0.75),transparent_32%),linear-gradient(160deg,#6a3d72,#321833)]" />
            {slide.image ? <img src={slide.image} alt="" className="ken absolute inset-0 h-full w-full object-cover" /> : null}
            <p className="absolute bottom-6 left-6 font-serif text-6xl text-ivory italic">01</p>
          </div>
          <div className="absolute right-0 bottom-8 rounded-full bg-ivory px-4 py-3 text-xs tracking-[0.18em] text-plum uppercase shadow-soft">
            edição atual
          </div>
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="mx-auto mt-6 flex max-w-6xl gap-2">
          {slides.map((item, itemIndex) => (
            <button
              key={`${item.title}-${itemIndex}`}
              type="button"
              aria-label={`Banner ${itemIndex + 1}`}
              onClick={() => setIndex(itemIndex)}
              className={cn('h-1.5 rounded-full transition-all', itemIndex === index ? 'w-10 bg-plum' : 'w-4 bg-plum/20')}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

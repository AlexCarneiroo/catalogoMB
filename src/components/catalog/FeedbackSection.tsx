import { useEffect, useState } from 'react'
import { useStore } from '@/contexts/StoreContext'
import { listActiveTestimonials } from '@/services/testimonialsService'
import type { Testimonial } from '@/types/models'
import { PUBLIC_DATA_EVENT } from '@/utils/cache'

export function FeedbackSection() {
  const { settings } = useStore()
  const [items, setItems] = useState<Testimonial[]>([])

  useEffect(() => {
    if (!settings.feedbackEnabled) {
      setItems([])
      return
    }
    let cancelled = false
    const load = () => {
      void listActiveTestimonials().then((next) => {
        if (!cancelled) setItems(next)
      })
    }
    load()
    window.addEventListener(PUBLIC_DATA_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(PUBLIC_DATA_EVENT, load)
    }
  }, [settings.feedbackEnabled])

  if (!settings.feedbackEnabled || items.length === 0) return null

  return (
    <section className="mt-24">
      <p className="text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">Quem passou por aqui</p>
      <h2 className="display mt-3 text-5xl text-plum md:text-7xl">Notas <span className="italic text-rose">da casa</span></h2>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {items.map((item) => (
          <blockquote key={item.id} className="rounded-[1.8rem] bg-white/80 p-7 shadow-soft">
            <p className="font-serif text-2xl leading-snug text-plum italic">“{item.text}”</p>
            <footer className="mt-6 text-sm text-muted">
              <span className="text-plum">{item.name}</span>
              {item.detail ? <span> · {item.detail}</span> : null}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DragScroll } from '@/components/catalog/DragScroll'
import { FeedbackSection } from '@/components/catalog/FeedbackSection'
import { Hero } from '@/components/catalog/Hero'
import { Marquee } from '@/components/catalog/Marquee'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Container } from '@/components/ui/Feedback'
import { EmptyState, Notice, Skeleton } from '@/components/ui/Feedback'
import { Seo } from '@/components/ui/Seo'
import { useStore } from '@/contexts/StoreContext'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { categoryName } from '@/utils/catalog'
import { paragraphs } from '@/utils/format'

export function HomePage() {
  const { banners, categories, settings, error } = useStore()
  const { products, loading } = useCatalogProducts()
  const location = useLocation()
  const featured = products.filter((product) => product.featured)
  const highlights = (featured.length > 0 ? featured : products).slice(0, 8)

  useEffect(() => {
    if (location.hash !== '#destaques') return
    document.getElementById('destaques')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  return (
    <div>
      <Seo title={settings.storeName} description={settings.seoDescription} image={banners[0]?.image || settings.logo} path="/" />
      <Hero banners={banners} />
      <Marquee words={categories.map((category) => category.name)} />
      <Container className="py-16 md:py-24">
        {error ? <Notice>{error}</Notice> : null}

        <section id="destaques">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">Maquiagem</p>
              <h2 className="display mt-3 text-5xl text-plum md:text-7xl">Destaques</h2>
            </div>
            <Link to="/produtos" className="link-gold mb-2 shrink-0 text-[11px] uppercase tracking-[0.18em] text-plum">
              Ver catálogo
            </Link>
          </div>
          {loading ? (
            <div className="mt-10 flex gap-5">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="aspect-[3/4] w-64 shrink-0" />
              ))}
            </div>
          ) : highlights.length > 0 ? (
            <DragScroll className="mt-10 flex items-stretch gap-5 pb-1">
              {highlights.map((product, index) => (
                <div key={product.id} className="flex w-64 shrink-0 sm:w-72">
                  <ProductCard index={index} product={product} category={categoryName(categories, product.categoryId)} />
                </div>
              ))}
            </DragScroll>
          ) : (
            <div className="mt-10">
              <EmptyState title="Nenhum destaque publicado" text="Quando os produtos em destaque forem cadastrados no painel, eles aparecem aqui." />
            </div>
          )}
        </section>

        {settings.aboutText ? (
          <section className="relative mt-24 overflow-hidden rounded-[2.2rem] bg-plum px-6 py-16 text-ivory md:px-16">
            <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full bg-rose/40 blur-3xl" />
            <p className="text-xs font-medium tracking-[0.28em] text-gold uppercase">A marca</p>
            <div className="relative mt-6 max-w-3xl space-y-4 font-serif text-3xl leading-snug italic md:text-5xl">
              {paragraphs(settings.aboutText).slice(0, 2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <Link to="/sobre" className="link-gold mt-8 inline-block text-[11px] uppercase tracking-[0.18em] text-gold">
              Conhecer a história
            </Link>
          </section>
        ) : null}

        <FeedbackSection />
      </Container>
    </div>
  )
}

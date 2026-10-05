import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ProductGrid } from '@/components/catalog/ProductCard'
import { Container, EmptyState, Skeleton } from '@/components/ui/Feedback'
import { Seo } from '@/components/ui/Seo'
import { useStore } from '@/contexts/StoreContext'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'

export function CategoryPage() {
  const { slug = '' } = useParams()
  const { categories, loading: storeLoading } = useStore()
  const { products, loading } = useCatalogProducts()
  const category = categories.find((item) => item.slug === slug)
  const items = useMemo(() => products.filter((product) => product.categoryId === category?.id), [products, category?.id])

  if (!category && (storeLoading || loading)) {
    return (
      <Container className="py-16">
        <Skeleton className="h-80" />
      </Container>
    )
  }

  if (!category) {
    return (
      <Container className="py-16">
        <EmptyState title="Categoria não encontrada" text="Ela pode estar inativa ou o endereço mudou." />
      </Container>
    )
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-ivory">
        <div className="pointer-events-none absolute top-10 -right-10 h-48 w-48 rounded-full bg-rose/40 blur-3xl" />
        <Container className="relative grid items-end gap-8 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">Categoria</p>
            <h1 className="display mt-3 text-6xl text-plum md:text-8xl">{category.name}</h1>
            {category.description ? <p className="mt-5 max-w-xl text-lg text-muted">{category.description}</p> : null}
          </div>
          <div className="float-frame relative h-72 overflow-hidden rounded-[2rem] bg-plum shadow-soft md:h-96">
            {category.image ? <img src={category.image} alt="" className="h-full w-full object-cover" /> : <div className="h-full bg-[radial-gradient(circle_at_30%_20%,rgba(216,164,182,0.8),transparent_40%),linear-gradient(160deg,#6d4578,#321833)]" />}
          </div>
        </Container>
      </section>
      <Container className="py-14">
        {category ? <Seo title={category.name} description={category.description} image={category.image} path={`/categoria/${category.slug}`} /> : null}
        <p className="text-sm text-muted">{items.length === 1 ? 'Encontramos 1 produto.' : `Encontramos ${items.length} produtos.`}</p>
        {loading ? <Skeleton className="mt-8 h-80" /> : null}
        {!loading && items.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="Nenhum produto encontrado." text="Esta categoria ainda não tem produtos publicados." />
          </div>
        ) : null}
        {items.length > 0 ? (
          <div className="mt-8">
            <ProductGrid products={items} categories={categories} />
          </div>
        ) : null}
      </Container>
    </div>
  )
}

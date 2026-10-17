import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductGrid } from '@/components/catalog/ProductCard'
import { Container, EmptyState, Notice, Skeleton } from '@/components/ui/Feedback'
import { Seo } from '@/components/ui/Seo'
import { useStore } from '@/contexts/StoreContext'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { filterProducts, isProductSort } from '@/utils/catalog'
import { cn } from '@/utils/format'
import type { ProductSort } from '@/types/models'

const PAGE_SIZE = 12

export function ProductsPage() {
  const { categories } = useStore()
  const { products, loading, error } = useCatalogProducts()
  const [params, setParams] = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const debounced = useDebouncedValue(query, 350)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const categorySlug = params.get('categoria') ?? ''
  const sortParam = params.get('ordem')
  const sort: ProductSort = isProductSort(sortParam) ? sortParam : 'recent'
  const featuredOnly = params.get('destaque') === '1'
  const promoOnly = params.get('promocao') === '1'
  const category = categories.find((item) => item.slug === categorySlug)

  const filtered = useMemo(
    () =>
      filterProducts(products, categories, {
        query: debounced,
        categoryId: category?.id ?? '',
        sort,
        featuredOnly,
        promoOnly,
      }),
    [products, categories, debounced, category?.id, sort, featuredOnly, promoOnly],
  )

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setVisible(PAGE_SIZE)
  }

  useEffect(() => {
    const fromUrl = params.get('q') ?? ''
    const typing = document.activeElement instanceof HTMLInputElement && document.activeElement.getAttribute('aria-label') === 'Buscar produtos'
    if (!typing) setQuery(fromUrl)
  }, [params])

  useEffect(() => {
    const term = debounced.trim()
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (term) next.set('q', term)
      else next.delete('q')
      return next.toString() === current.toString() ? current : next
    }, { replace: true })
  }, [debounced, setParams])

  const shown = filtered.slice(0, visible)

  return (
    <Container className="rise py-12 md:py-16">
      <Seo title="Produtos" path="/produtos" />
      <p className="text-xs font-medium tracking-[0.28em] text-gold-deep uppercase">Catálogo</p>
      <h1 className="display mt-3 text-5xl text-plum md:text-7xl">Produtos</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, código ou tag"
          aria-label="Buscar produtos"
          className="min-h-11 rounded-full border border-plum/10 bg-white/80 px-5 py-3 text-base shadow-soft outline-none focus:border-gold"
        />
        <select
          value={categorySlug}
          onChange={(event) => updateParam('categoria', event.target.value)}
          aria-label="Filtrar por categoria"
          className="min-h-11 rounded-full border border-plum/10 bg-white/80 px-5 py-3 text-base shadow-soft outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => updateParam('ordem', event.target.value === 'recent' ? '' : event.target.value)}
          aria-label="Ordenar produtos"
          className="min-h-11 rounded-full border border-plum/10 bg-white/80 px-5 py-3 text-base shadow-soft outline-none"
        >
          <option value="recent">Mais recentes</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name">Nome</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={featuredOnly} onClick={() => updateParam('destaque', featuredOnly ? '' : '1')}>
          Destaques
        </FilterChip>
        <FilterChip active={promoOnly} onClick={() => updateParam('promocao', promoOnly ? '' : '1')}>
          Promoções
        </FilterChip>
      </div>
      <p className="mt-8 text-sm text-muted">{filtered.length === 1 ? 'Encontramos 1 produto.' : `Encontramos ${filtered.length} produtos.`}</p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="aspect-[3/4]" />
          ))}
        </div>
      ) : shown.length > 0 ? (
        <div className="mt-8">
          <ProductGrid products={shown} categories={categories} />
          {visible < filtered.length ? (
            <div className="mt-12 text-center">
              <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-plum" onClick={() => setVisible((value) => value + PAGE_SIZE)}>
                Carregar mais
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Nenhum produto encontrado."
            text={products.length === 0 ? 'O catálogo ainda não tem produtos publicados.' : 'Tente outro nome, outra categoria ou limpe os filtros.'}
          />
        </div>
      )}
    </Container>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('min-h-11 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.08em] transition hover:-translate-y-0.5', active ? 'border-plum bg-plum text-ivory' : 'border-plum/15 bg-white/70 text-plum')}>
      {children}
    </button>
  )
}

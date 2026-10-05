import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import { listAllBanners } from '@/services/bannersService'
import { listAllCategories } from '@/services/categoriesService'
import { listAllProducts } from '@/services/productsService'
import type { Product } from '@/types/models'
import { isOnSale } from '@/utils/catalog'
import { getErrorMessage } from '@/utils/errors'
import { formatDate } from '@/utils/format'

export function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categoryCount, setCategoryCount] = useState(0)
  const [bannerCount, setBannerCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([listAllProducts(), listAllCategories(), listAllBanners()])
      .then(([nextProducts, categories, banners]) => {
        if (cancelled) return
        setProducts(nextProducts)
        setCategoryCount(categories.length)
        setBannerCount(banners.length)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const stats = [
    ['Produtos', products.length],
    ['Ativos', products.filter((product) => product.active).length],
    ['Inativos', products.filter((product) => !product.active).length],
    ['Categorias', categoryCount],
    ['Destaques', products.filter((product) => product.featured).length],
    ['Promoções', products.filter((product) => isOnSale(product)).length],
    ['Banners', bannerCount],
    ['Estoque baixo', products.filter((product) => product.stock !== null && product.stock <= 3).length],
  ]

  const shortcuts = [
    ['/admin/produtos/novo', 'Adicionar produto'],
    ['/admin/destaques', 'Destaques'],
    ['/admin/estoque', 'Estoque'],
    ['/admin/anuncio', 'Anúncio'],
    ['/admin/feedbacks', 'Feedbacks'],
    ['/admin/configuracoes', 'Nome, logo e contato'],
  ]

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Visão geral</p>
          <h1 className="mt-2 font-serif text-5xl text-plum">Painel</h1>
        </div>
        <Link to="/admin/produtos/novo" className="bg-plum px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-ivory">
          Adicionar produto
        </Link>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map(([to, label]) => (
          <Link key={to} to={to} className="border border-plum/10 bg-white px-5 py-4 font-serif text-2xl text-plum transition hover:border-gold">
            {label}
          </Link>
        ))}
      </div>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <article key={String(label)} className="border border-plum/10 bg-white p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
              <p className="mt-3 font-serif text-4xl text-plum">{value}</p>
            </article>
          ))}
        </div>
      )}
      <section className="mt-12">
        <h2 className="font-serif text-3xl text-plum">Produtos adicionados recentemente</h2>
        <div className="mt-5 divide-y divide-plum/10 border border-plum/10 bg-white">
          {products.slice(0, 5).map((product) => (
            <Link key={product.id} to={`/admin/produtos/${product.id}`} className="flex items-center justify-between gap-4 px-4 py-4">
              <span className="font-serif text-2xl text-plum">{product.name}</span>
              <span className="text-xs text-muted">{formatDate(product.createdAt)}</span>
            </Link>
          ))}
          {!loading && products.length === 0 ? <p className="px-4 py-8 text-sm text-muted">Nenhum produto cadastrado.</p> : null}
        </div>
      </section>
    </div>
  )
}

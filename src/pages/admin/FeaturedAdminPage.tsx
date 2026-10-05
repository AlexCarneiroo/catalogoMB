import { useEffect, useState } from 'react'
import { RowMenu } from '@/components/admin/RowMenu'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { listAllProducts, updateProductFlags } from '@/services/productsService'
import type { Product } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'
import { formatCurrency } from '@/utils/format'

export function FeaturedAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listAllProducts()
      .then((next) => {
        if (!cancelled) setProducts(next)
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

  async function toggle(product: Product) {
    setBusyId(product.id)
    setError(null)
    try {
      await updateProductFlags(product.id, { featured: !product.featured })
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, featured: !item.featured } : item)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const featured = products.filter((product) => product.featured)

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Começo da página</p>
      <h1 className="mt-2 font-serif text-5xl text-plum">Destaques</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Os produtos marcados aparecem na faixa do início do catálogo. A ordem segue os mais recentes.</p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? <Spinner label="Carregando destaques" /> : (
        <div className="mt-8 divide-y divide-plum/10 border border-plum/10 bg-white">
          <p className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-muted">{featured.length} em destaque</p>
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-serif text-2xl text-plum">{product.name}</p>
                <p className="text-xs text-muted">{formatCurrency(product.price)}{product.active ? '' : ' · inativo'}</p>
              </div>
              <RowMenu
                items={[
                  { label: 'Editar', to: `/admin/produtos/${product.id}` },
                  {
                    label: product.featured ? 'Tirar do destaque' : 'Colocar em destaque',
                    disabled: busyId === product.id,
                    onSelect: () => void toggle(product),
                  },
                ]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

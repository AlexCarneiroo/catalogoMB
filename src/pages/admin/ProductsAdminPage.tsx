import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RowMenu } from '@/components/admin/RowMenu'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import { listAllCategories } from '@/services/categoriesService'
import { duplicateProduct, listAllProducts, removeProduct, updateProductFlags } from '@/services/productsService'
import type { Category, Product } from '@/types/models'
import { isOnSale } from '@/utils/catalog'
import { getErrorMessage } from '@/utils/errors'
import { formatCurrency, formatDate } from '@/utils/format'

export function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [nextProducts, nextCategories] = await Promise.all([listAllProducts(), listAllCategories()])
      setProducts(nextProducts)
      setCategories(nextCategories)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggle(product: Product, flag: 'active' | 'featured') {
    const next = !product[flag]
    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, [flag]: next } : item)))
    try {
      await updateProductFlags(product.id, { [flag]: next })
    } catch (err) {
      setError(getErrorMessage(err))
      setProducts((current) => current.map((item) => (item.id === product.id ? product : item)))
    }
  }

  async function onDuplicate(id: string) {
    setBusyId(id)
    try {
      await duplicateProduct(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function onDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    try {
      await removeProduct(pendingDelete)
      setProducts((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Catálogo</p>
          <h1 className="mt-2 font-serif text-5xl text-plum">Produtos</h1>
        </div>
        <Link to="/admin/produtos/novo" className="bg-plum px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-ivory">
          Adicionar produto
        </Link>
      </div>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? <Skeleton className="mt-8 h-64" /> : null}
      {!loading && products.length === 0 ? <p className="mt-8 text-sm text-muted">Nenhum produto cadastrado.</p> : null}
      <div className="mt-8 hidden overflow-x-auto border border-plum/10 bg-white md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Foto</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Destaque</th>
              <th className="px-4 py-3 font-medium">Criação</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-plum/10">
                <td className="px-4 py-3">{product.mainImage ? <img src={product.mainImage} alt="" className="h-14 w-11 object-cover" /> : <span className="block h-14 w-11 bg-ivory-deep" />}</td>
                <td className="px-4 py-3 font-serif text-xl text-plum">{product.name}</td>
                <td className="px-4 py-3">{categories.find((item) => item.id === product.categoryId)?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  {formatCurrency(isOnSale(product) && product.promotionalPrice !== null ? product.promotionalPrice : product.price)}
                </td>
                <td className="px-4 py-3">{product.active ? 'Ativo' : 'Inativo'}</td>
                <td className="px-4 py-3">{product.featured ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-3">{formatDate(product.createdAt)}</td>
                <td className="px-4 py-3">
                  <Actions product={product} busy={busyId === product.id} onToggle={(flag) => void toggle(product, flag)} onDuplicate={() => void onDuplicate(product.id)} onDelete={() => setPendingDelete(product)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 space-y-4 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="border border-plum/10 bg-white p-4">
            <div className="flex gap-4">
              {product.mainImage ? <img src={product.mainImage} alt="" className="h-20 w-16 object-cover" /> : null}
              <div>
                <h2 className="font-serif text-2xl text-plum">{product.name}</h2>
                <p className="text-sm text-muted">{product.active ? 'Ativo' : 'Inativo'} · {formatDate(product.createdAt)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Actions product={product} busy={busyId === product.id} onToggle={(flag) => void toggle(product, flag)} onDuplicate={() => void onDuplicate(product.id)} onDelete={() => setPendingDelete(product)} />
            </div>
          </article>
        ))}
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir produto"
        description={pendingDelete ? `Excluir “${pendingDelete.name}” e as fotos deste produto?` : ''}
        busy={busyId === pendingDelete?.id}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void onDelete()}
      />
    </div>
  )
}

function Actions({
  product,
  busy,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  product: Product
  busy: boolean
  onToggle: (flag: 'active' | 'featured') => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <RowMenu
      items={[
        { label: 'Editar', to: `/admin/produtos/${product.id}` },
        { label: 'Visualizar', href: `/produto/${product.slug}` },
        { label: 'Duplicar', onSelect: onDuplicate, disabled: busy },
        { label: product.active ? 'Desativar' : 'Ativar', onSelect: () => onToggle('active'), disabled: busy },
        { label: product.featured ? 'Tirar destaque' : 'Destacar', onSelect: () => onToggle('featured'), disabled: busy },
        { label: 'Excluir', onSelect: onDelete, danger: true, disabled: busy },
      ]}
    />
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RowMenu } from '@/components/admin/RowMenu'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Notice, Skeleton } from '@/components/ui/Feedback'
import { listAllCategories } from '@/services/categoriesService'
import { duplicateProduct, listAllProducts, removeProduct, updateProductFlags } from '@/services/productsService'
import type { Category, Product } from '@/types/models'
import { useToast } from '@/contexts/ToastContext'
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
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [featured, setFeatured] = useState<'all' | 'yes' | 'no'>('all')
  const { notify } = useToast()

  function fail(err: unknown) {
    const message = getErrorMessage(err)
    setError(message)
    notify(message, 'error')
  }

  async function load() {
    setLoading(true)
    try {
      const [nextProducts, nextCategories] = await Promise.all([listAllProducts(), listAllCategories()])
      setProducts(nextProducts)
      setCategories(nextCategories)
      setError(null)
    } catch (err) {
      fail(err)
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
      notify(flag === 'active' ? (next ? 'Produto ativado.' : 'Produto desativado.') : next ? 'Produto em destaque.' : 'Destaque removido.')
    } catch (err) {
      fail(err)
      setProducts((current) => current.map((item) => (item.id === product.id ? product : item)))
    }
  }

  async function onDuplicate(id: string) {
    setBusyId(id)
    try {
      await duplicateProduct(id)
      notify('Produto duplicado.')
      await load()
    } catch (err) {
      fail(err)
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR')
    return products.filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false
      if (status === 'active' && !product.active) return false
      if (status === 'inactive' && product.active) return false
      if (featured === 'yes' && !product.featured) return false
      if (featured === 'no' && product.featured) return false
      if (!term) return true
      const category = categories.find((item) => item.id === product.categoryId)?.name ?? ''
      const haystack = [product.name, product.brand, product.sku, product.code, category, product.tags.join(' '), product.colors.map((color) => color.name).join(' ')]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
      return haystack.includes(term)
    })
  }, [products, categories, query, categoryId, status, featured])

  const filtering = query.trim().length > 0 || categoryId !== '' || status !== 'all' || featured !== 'all'

  async function onDelete() {
    if (!pendingDelete) return
    setBusyId(pendingDelete.id)
    try {
      await removeProduct(pendingDelete)
      setProducts((current) => current.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
      notify('Produto excluído.')
    } catch (err) {
      fail(err)
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
      {!loading && products.length > 0 ? (
        <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_minmax(0,0.6fr)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, código ou SKU"
            aria-label="Buscar produtos"
            className="min-h-11 border border-plum/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-gold"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label="Filtrar por categoria"
            className="min-h-11 border border-plum/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-gold"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'all' | 'active' | 'inactive')}
            aria-label="Filtrar por status"
            className="min-h-11 border border-plum/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-gold"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select
            value={featured}
            onChange={(event) => setFeatured(event.target.value as 'all' | 'yes' | 'no')}
            aria-label="Filtrar por destaque"
            className="min-h-11 border border-plum/15 bg-white px-4 py-3 text-base text-ink outline-none focus:border-gold"
          >
            <option value="all">Destaque</option>
            <option value="yes">Em destaque</option>
            <option value="no">Sem destaque</option>
          </select>
          <div className="flex items-center justify-between gap-3 md:col-span-4">
            <p className="text-sm text-muted">
              {filtered.length === products.length
                ? `${products.length} ${products.length === 1 ? 'produto' : 'produtos'}`
                : `${filtered.length} de ${products.length} produtos`}
            </p>
            {filtering ? (
              <button
                type="button"
                className="text-[11px] tracking-[0.16em] text-plum uppercase"
                onClick={() => {
                  setQuery('')
                  setCategoryId('')
                  setStatus('all')
                  setFeatured('all')
                }}
              >
                Limpar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {!loading && products.length > 0 && filtered.length === 0 ? <p className="mt-6 text-sm text-muted">Nenhum produto encontrado com esses filtros.</p> : null}
      {!loading && filtered.length > 0 ? <div className="mt-6 hidden overflow-x-auto border border-plum/10 bg-white md:block">
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
            {filtered.map((product) => (
              <tr key={product.id} className="border-t border-plum/10">
                <td className="px-4 py-3">{product.mainImage ? <img src={product.mainImage} alt="" className="h-14 w-11 object-cover" /> : <span className="block h-14 w-11 bg-ivory-deep" />}</td>
                <td className="px-4 py-3">
                  <p className="font-serif text-xl text-plum">{product.name}</p>
                  {product.code ? <p className="mt-1 text-xs tracking-[0.08em] text-muted uppercase">{product.code}</p> : null}
                </td>
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
      </div> : null}
      {!loading && filtered.length > 0 ? <div className="mt-6 space-y-4 md:hidden">
        {filtered.map((product) => (
          <article key={product.id} className="border border-plum/10 bg-white p-4">
            <div className="flex gap-4">
              {product.mainImage ? <img src={product.mainImage} alt="" className="h-20 w-16 object-cover" /> : null}
              <div>
                <h2 className="font-serif text-2xl text-plum">{product.name}</h2>
                <p className="text-sm text-muted">{product.active ? 'Ativo' : 'Inativo'} · {formatDate(product.createdAt)}{product.code ? ` · ${product.code}` : ''}</p>
              </div>
            </div>
            <div className="mt-4">
              <Actions product={product} busy={busyId === product.id} onToggle={(flag) => void toggle(product, flag)} onDuplicate={() => void onDuplicate(product.id)} onDelete={() => setPendingDelete(product)} />
            </div>
          </article>
        ))}
      </div> : null}
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

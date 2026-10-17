import { useEffect, useState } from 'react'
import { Notice, Spinner } from '@/components/ui/Feedback'
import { useToast } from '@/contexts/ToastContext'
import { listAllProducts, updateProductStock } from '@/services/productsService'
import type { Product } from '@/types/models'
import { getErrorMessage } from '@/utils/errors'

export function StockAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const { notify } = useToast()

  useEffect(() => {
    let cancelled = false
    void listAllProducts()
      .then((next) => {
        if (cancelled) return
        setProducts(next)
        setDrafts(Object.fromEntries(next.map((product) => [product.id, product.stock === null ? '' : String(product.stock)])))
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = getErrorMessage(err)
          setError(message)
          notify(message, 'error')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function save(product: Product) {
    const raw = (drafts[product.id] ?? '').trim()
    const stock = raw === '' ? null : Number(raw)
    const current = product.stock === null ? '' : String(product.stock)
    if (raw === current) return
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setError('Use um número inteiro ou deixe vazio para não controlar.')
      notify('Use um número inteiro ou deixe vazio para não controlar.', 'error')
      return
    }
    setBusyId(product.id)
    setError(null)
    try {
      await updateProductStock(product.id, stock)
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, stock } : item)))
      setSavedId(product.id)
      notify('Estoque atualizado.')
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      notify(message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold-deep">Casa</p>
      <h1 className="mt-2 font-serif text-5xl text-plum">Estoque</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Quantidade disponível. O valor salva ao sair do campo. Vazio significa que a peça não tem controle de estoque. Zero aparece como esgotado no catálogo.</p>
      {error ? <div className="mt-6"><Notice>{error}</Notice></div> : null}
      {loading ? <Spinner label="Carregando estoque" /> : (
        <div className="mt-8 divide-y divide-plum/10 border border-plum/10 bg-white">
          {products.map((product) => {
            const value = drafts[product.id] ?? ''
            const low = value !== '' && Number(value) <= 3
            return (
              <form key={product.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4" onSubmit={(event) => event.preventDefault()}>
                <div>
                  <p className="font-serif text-2xl text-plum">{product.name}</p>
                  <p className={`text-xs ${low ? 'text-rose' : 'text-muted'}`}>{product.sku || 'Sem SKU'}{low ? ' · estoque baixo' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    inputMode="numeric"
                    value={value}
                    onChange={(event) => setDrafts((current) => ({ ...current, [product.id]: event.target.value }))}
                    onBlur={() => void save(product)}
                    placeholder="—"
                    aria-label={`Estoque de ${product.name}`}
                    className="h-11 w-24 border border-plum/15 bg-ivory px-3 py-2 text-base outline-none focus:border-gold"
                  />
                  <span className="w-16 text-[11px] uppercase tracking-[0.14em] text-gold-deep">
                    {busyId === product.id ? 'Salvando' : savedId === product.id ? 'Salvo' : ''}
                  </span>
                </div>
              </form>
            )
          })}
        </div>
      )}
    </div>
  )
}

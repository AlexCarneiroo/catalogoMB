import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Monogram } from '@/components/brand/BrandMark'
import { DragScroll } from '@/components/catalog/DragScroll'
import { PriceTag } from '@/components/catalog/ProductCard'
import { EmptyState, Notice } from '@/components/ui/Feedback'
import { buttonClass } from '@/components/ui/Button'
import { Seo } from '@/components/ui/Seo'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useStore } from '@/contexts/StoreContext'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { getAnyProductBySlug } from '@/services/productsService'
import type { Product } from '@/types/models'
import { categoryName, discountPercent, effectivePrice, isOnSale, productInquiryMessage, relatedProducts } from '@/utils/catalog'
import { getErrorMessage } from '@/utils/errors'
import { cn, paragraphs, whatsappHref } from '@/utils/format'
import { backgroundLocation, productLinkState } from '@/utils/productLink'

const chapters = [
  { id: 'peca', label: 'A peça', field: 'description' },
  { id: 'pele', label: 'Na pele', field: 'howToUse' },
  { id: 'formula', label: 'Fórmula', field: 'ingredients' },
  { id: 'fica', label: 'O que fica', field: 'benefits' },
] as const

function availabilityLabel(product: Product): string {
  if (!product.active) return 'Indisponível'
  if (product.stock === 0) return 'Esgotado'
  if (product.stock !== null) return `Disponível · ${product.stock} un.`
  return 'Disponível na casa'
}

export function ProductPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { categories, settings } = useStore()
  const { lines, add, setOpen: setCartOpen } = useCart()
  const { isAdmin } = useAuth()
  const { products, loading } = useCatalogProducts()
  const [product, setProduct] = useState<Product | null>(null)
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photo, setPhoto] = useState(0)
  const [chapter, setChapter] = useState<(typeof chapters)[number]['id']>('peca')
  const [zoomed, setZoomed] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [colorId, setColorId] = useState('')
  const [added, setAdded] = useState(false)
  const zoomedRef = useRef(false)
  zoomedRef.current = zoomed

  useEffect(() => {
    if (loading) return
    let cancelled = false
    const fromList = products.find((item) => item.slug === slug)
    if (fromList) {
      setProduct(fromList)
      setMissing(false)
      setPhoto(0)
      setChapter('peca')
      setZoomed(false)
      setQuantity(1)
      setColorId(fromList.colors[0]?.id ?? '')
      setAdded(false)
      return
    }
    if (!isAdmin) {
      setProduct(null)
      setMissing(true)
      return
    }
    void getAnyProductBySlug(slug)
      .then((found) => {
        if (cancelled) return
        setProduct(found)
        setMissing(!found)
        setPhoto(0)
        setQuantity(1)
        setColorId(found?.colors[0]?.id ?? '')
        setAdded(false)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [slug, products, isAdmin, loading])

  function close() {
    if (backgroundLocation(location)) navigate(-1)
    else navigate('/produtos')
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (zoomedRef.current) {
        setZoomed(false)
        return
      }
      if (backgroundLocation(location)) navigate(-1)
      else navigate('/produtos')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [location, navigate])

  const story = chapters
    .map((item) => ({ ...item, text: product ? product[item.field].trim() : '' }))
    .filter((item) => item.text)
  const activeChapter = story.find((item) => item.id === chapter) ?? story[0]
  const photos = product?.images ?? []
  const current = photos[photo] ?? photos[0]
  const category = product ? categories.find((item) => item.id === product.categoryId) : undefined
  const related = product ? relatedProducts(products, product) : []
  const whatsapp = product
    ? whatsappHref(
        settings.whatsapp,
        productInquiryMessage(
          product,
          category?.name || categoryName(categories, product.categoryId),
          `${window.location.origin}/produto/${product.slug}`,
          product.colors.find((color) => color.id === colorId)?.name ?? product.colors[0]?.name ?? '',
        ),
      )
    : ''
  const selectedColor = product?.colors.find((color) => color.id === colorId) ?? product?.colors[0] ?? null
  const productLines = product ? lines.filter((line) => line.productId === product.id) : []
  const inCart = selectedColor
    ? (productLines.find((line) => line.colorId === selectedColor.id)?.quantity ?? 0)
    : (productLines.find((line) => line.colorId === '')?.quantity ?? 0)
  const used = productLines.reduce((sum, line) => sum + line.quantity, 0)
  const stockCap = product ? (product.stock === null ? 99 : product.stock) : 0
  const room = Math.max(0, stockCap - used)
  const soldOut = Boolean(product && stockCap <= 0)
  const details = product
    ? [
        ['Marca', product.brand.trim()],
        ['SKU', product.sku.trim()],
        ['Código', product.code.trim()],
        ['Peso', product.weight.trim()],
        ['Dimensões', product.dimensions.trim()],
      ].filter((entry): entry is [string, string] => entry[1].length > 0)
    : []

  return (
    <div data-scroll-lock="" className="fixed inset-0 z-[90] flex items-end justify-center bg-plum-deep/50 p-0 backdrop-blur-[6px] sm:items-center sm:p-5" role="presentation" onClick={close}>
      {product ? (
        <Seo
          title={product.seoTitle || product.name}
          description={product.seoDescription || product.shortDescription || product.description}
          image={product.mainImage}
          path={`/produto/${product.slug}`}
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.shortDescription || product.description,
            image: product.images.map((image) => image.url),
            sku: product.sku || undefined,
            brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              price: effectivePrice(product).toFixed(2),
              availability: product.active && product.stock !== 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          }}
        />
      ) : null}
      <article
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ?? 'Produto'}
        className="sheet-in relative flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-ivory shadow-soft sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:flex-row sm:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 grid h-11 place-items-center rounded-full bg-ivory/90 px-4 text-[11px] tracking-[0.18em] text-plum uppercase shadow-soft"
        >
          Fechar
        </button>

        {!product ? (
          <div className="grid min-h-[50vh] flex-1 place-items-center p-8">
            {error ? <Notice>{error}</Notice> : null}
            {missing ? <EmptyState title="Produto não encontrado" text="Ele pode ter sido despublicado ou o endereço mudou." /> : <div className="h-72 w-52 animate-pulse rounded-[1.6rem] bg-plum/10" />}
          </div>
        ) : (
          <>
            <div className="relative h-[34vh] max-h-72 shrink-0 bg-plum-deep sm:h-auto sm:max-h-none sm:min-h-0 sm:w-[46%] sm:self-stretch">
              {current ? (
                <button type="button" className="absolute inset-0" onClick={() => setZoomed(true)} aria-label="Ampliar foto">
                  <img src={current.url} alt={product.name} className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="grid h-[42vh] place-items-center text-sm text-ivory/70 sm:h-full">Sem foto</div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-plum-deep/50 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isOnSale(product) ? <span className="rounded-full bg-rose px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-plum-deep uppercase">Oferta</span> : null}
                {product.isNew ? <span className="rounded-full bg-ivory/90 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-gold-deep uppercase">Novo</span> : null}
              </div>
              {photos.length > 1 ? (
                <DragScroll className="absolute inset-x-0 bottom-0 flex gap-2 p-4">
                  {photos.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() => setPhoto(index)}
                      className={cn('h-14 w-11 shrink-0 overflow-hidden rounded-xl border-2', index === photo ? 'border-gold' : 'border-transparent')}
                      aria-label={`Foto ${index + 1}`}
                    >
                      <img src={image.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </DragScroll>
              ) : null}
            </div>

            <DragScroll axis="y" className="min-h-0 flex-1 px-5 py-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:max-h-[92vh] sm:px-10 sm:py-10">
              <div className="flex items-center gap-3">
                <Monogram className="h-9 w-9" />
                {category ? (
                  <Link to={`/categoria/${category.slug}`} className="text-[11px] tracking-[0.22em] text-gold-deep uppercase">
                    {category.name}
                  </Link>
                ) : (
                  <p className="text-[11px] tracking-[0.22em] text-muted uppercase">{categoryName(categories, product.categoryId) || 'Peça'}</p>
                )}
              </div>
              {!product.active ? <div className="mt-4"><Notice>Pré-visualização: este produto está inativo e não aparece no catálogo.</Notice></div> : null}
              <h1 className="display mt-4 text-4xl break-words text-plum sm:text-5xl md:text-6xl">{product.name}</h1>
              {product.shortDescription.trim() ? <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{product.shortDescription.trim()}</p> : null}
              <PriceTag product={product} large />
              {product.colors.length > 0 ? (
                <div className="mt-6">
                  <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Cor · {selectedColor?.name}</p>
                  <div className="mt-3 flex flex-wrap gap-2" role="listbox" aria-label="Cores disponíveis">
                    {product.colors.map((color) => {
                      const selected = color.id === selectedColor?.id
                      return (
                        <button
                          key={color.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          title={color.name}
                          onClick={() => {
                            setColorId(color.id)
                            setAdded(false)
                          }}
                          className={cn('grid h-11 min-w-11 place-items-center rounded-full border-2 px-1', selected ? 'border-plum' : 'border-transparent')}
                        >
                          <span className="h-8 w-8 rounded-full border border-plum/15" style={{ backgroundColor: color.hex }} />
                          <span className="sr-only">{color.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
              <p className="mt-3 text-sm text-plum">{availabilityLabel(product)}</p>
              {discountPercent(product) ? <p className="mt-1 text-xs tracking-[0.14em] text-gold-deep uppercase">{discountPercent(product)}% nesta edição</p> : null}
              <div className="mt-7 flex flex-col gap-3">
                {room > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full bg-rose-soft">
                      <button type="button" className="grid h-11 w-11 place-items-center text-lg text-plum" aria-label="Diminuir quantidade" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm text-plum">{Math.min(quantity, room)}</span>
                      <button type="button" className="grid h-11 w-11 place-items-center text-lg text-plum disabled:opacity-40" aria-label="Aumentar quantidade" disabled={quantity >= room} onClick={() => setQuantity((current) => Math.min(room, current + 1))}>
                        +
                      </button>
                    </div>
                    <p className="text-sm text-muted">{inCart > 0 ? `${inCart} no carrinho` : 'Quantidade'}</p>
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={soldOut || room <= 0}
                    className={buttonClass('primary', 'min-h-11')}
                    onClick={() => {
                      add(product, category?.name || categoryName(categories, product.categoryId), Math.min(quantity, room), selectedColor)
                      setAdded(true)
                      setQuantity(1)
                    }}
                  >
                    {soldOut ? 'Esgotado' : room <= 0 ? 'No carrinho' : 'Adicionar ao carrinho'}
                  </button>
                  {whatsapp ? (
                    <a href={whatsapp} target={whatsapp.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className={buttonClass('gold', 'min-h-11')}>
                      Falar no WhatsApp
                    </a>
                  ) : null}
                </div>
                {added ? (
                  <button type="button" className="w-fit text-[11px] tracking-[0.16em] text-gold-deep uppercase" onClick={() => setCartOpen(true)}>
                    Adicionado · ver carrinho
                  </button>
                ) : null}
              </div>

              {story.length > 0 ? (
                <div className="mt-10">
                  <div className="flex flex-wrap gap-2">
                    {story.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setChapter(item.id)}
                        className={cn(
                          'rounded-full px-4 py-2 text-[11px] tracking-[0.14em] uppercase',
                          activeChapter?.id === item.id ? 'bg-plum text-ivory' : 'bg-rose-soft text-plum',
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {activeChapter ? (
                    <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
                      {paragraphs(activeChapter.text).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {details.length > 0 ? (
                <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-plum/10 pt-6">
                  {details.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[10px] tracking-[0.18em] text-muted uppercase">{label}</dt>
                      <dd className="mt-1 text-sm text-plum">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {product.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Link key={tag} to={`/produtos?q=${encodeURIComponent(tag)}`} className="rounded-full bg-lilac-soft px-3 py-1 text-[11px] tracking-[0.14em] text-plum uppercase">
                      {tag}
                    </Link>
                  ))}
                </div>
              ) : null}

              {related.length > 0 ? (
                <div className="mt-10">
                  <p className="text-[11px] tracking-[0.22em] text-gold-deep uppercase">Na mesma edição</p>
                  <DragScroll className="mt-4 flex gap-3 pb-1">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        to={`/produto/${item.slug}`}
                        state={productLinkState(location)}
                        className="w-28 shrink-0"
                      >
                        {item.mainImage ? <img src={item.mainImage} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" /> : <span className="block aspect-[3/4] rounded-2xl bg-ivory-deep" />}
                        <span className="mt-2 block font-serif text-base leading-tight break-words text-plum italic">{item.name}</span>
                      </Link>
                    ))}
                  </DragScroll>
                </div>
              ) : null}
            </DragScroll>
          </>
        )}
      </article>

      {zoomed && current ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-plum-deep/92 p-4"
          role="presentation"
          onClick={(event) => {
            event.stopPropagation()
            setZoomed(false)
          }}
        >
          <img src={current.url} alt={product?.name ?? ''} className="max-h-[88vh] max-w-full object-contain" />
        </div>
      ) : null}
    </div>
  )
}

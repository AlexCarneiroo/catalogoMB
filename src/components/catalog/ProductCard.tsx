import { Link, useLocation } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/types/models'
import { discountPercent, isOnSale } from '@/utils/catalog'
import { formatCurrency } from '@/utils/format'
import { productLinkState } from '@/utils/productLink'

export function PriceTag({ product, large = false }: { product: Product; large?: boolean }) {
  const discount = discountPercent(product)
  const onSale = isOnSale(product)
  return (
    <p className={large ? 'mt-4 flex flex-wrap items-baseline gap-3' : 'mt-2 flex h-7 items-baseline gap-2 overflow-hidden whitespace-nowrap'}>
      <span className={large ? 'font-serif text-5xl text-plum italic' : 'shrink-0 font-serif text-xl text-plum'}>
        {formatCurrency(onSale && product.promotionalPrice !== null ? product.promotionalPrice : product.price)}
      </span>
      {onSale ? <span className="truncate text-sm text-muted line-through">{formatCurrency(product.price)}</span> : null}
      {discount && large ? <span className="rounded-full bg-rose-soft px-2 py-0.5 text-[11px] text-plum">-{discount}%</span> : null}
    </p>
  )
}

export function ProductCard({ product, category, index = 0 }: { product: Product; category: string; index?: number }) {
  const location = useLocation()
  const { lines, add } = useCart()
  const discount = discountPercent(product)
  const image = product.mainImage || product.images[0]?.url
  const inCart = lines.find((line) => line.productId === product.id)?.quantity ?? 0
  const cap = product.stock === null ? 99 : product.stock
  const soldOut = cap <= 0
  const full = inCart >= cap && cap > 0

  return (
    <article className="rise group flex h-full w-full flex-col" style={{ animationDelay: `${index * 80}ms` }}>
      <Link to={`/produto/${product.slug}`} state={productLinkState(location)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.8rem] bg-ivory-deep shadow-soft">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs tracking-[0.18em] text-muted uppercase">Sem foto</div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 translate-y-4 bg-gradient-to-t from-plum-deep/55 to-transparent opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount ? <span className="rounded-full bg-rose px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-plum-deep uppercase">-{discount}%</span> : null}
            {product.isNew ? <span className="rounded-full bg-ivory/90 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-gold-deep uppercase">Novo</span> : null}
          </div>
          <span className="absolute right-4 bottom-4 translate-y-3 text-xs font-semibold tracking-[0.14em] text-ivory uppercase opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            Ver produto
          </span>
        </div>
        <div className="px-1 pt-4">
          <p className="min-h-4 truncate text-[11px] font-medium tracking-[0.2em] text-gold-deep uppercase">{category || ' '}</p>
          <h3 className="mt-1 truncate font-serif text-lg text-plum italic sm:text-2xl">{product.name}</h3>
          <PriceTag product={product} />
        </div>
      </Link>
      <button
        type="button"
        disabled={soldOut || full}
        onClick={() => add(product, category, 1)}
        className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-full bg-plum px-4 text-[11px] font-semibold tracking-[0.12em] text-ivory uppercase disabled:cursor-not-allowed disabled:opacity-50"
      >
        {soldOut ? 'Esgotado' : full ? 'No carrinho' : inCart > 0 ? 'Adicionar mais' : 'Adicionar'}
      </button>
    </article>
  )
}

export function ProductGrid({ products, categories }: { products: Product[]; categories: { id: string; name: string }[] }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-7">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          category={categories.find((item) => item.id === product.categoryId)?.name ?? ''}
        />
      ))}
    </div>
  )
}

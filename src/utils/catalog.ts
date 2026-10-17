import type { CartLine, CatalogFilters, Category, Product, ProductSort } from '@/types/models'
import { formatCurrency } from '@/utils/format'

export function isOnSale(product: Product): boolean {
  return discountPercent(product) !== null
}

export function discountPercent(product: Product): number | null {
  if (product.promotionalPrice === null || product.price <= 0) return null
  if (product.promotionalPrice >= product.price) return null
  return Math.round((1 - product.promotionalPrice / product.price) * 100)
}

export function effectivePrice(product: Product): number {
  if (product.promotionalPrice !== null && product.promotionalPrice < product.price) {
    return product.promotionalPrice
  }
  return product.price
}

export function categoryName(categories: Category[], categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.name ?? ''
}

export function lineUnitPrice(price: number, promotionalPrice: number | null): number {
  if (promotionalPrice !== null && promotionalPrice < price) return promotionalPrice
  return price
}

export function cartCheckoutMessage(storeName: string, lines: CartLine[], origin: string): string {
  const blocks = lines.map((line, index) => {
    const unit = lineUnitPrice(line.price, line.promotionalPrice)
    const rows = [`${index + 1}. *${line.name}*`]
    if (line.category) rows.push(line.category)
    rows.push(`Quantidade: ${line.quantity}`)
    if (line.promotionalPrice !== null && line.promotionalPrice < line.price) {
      rows.push(`Valor: ${formatCurrency(unit)} cada (de ${formatCurrency(line.price)})`)
    } else {
      rows.push(`Valor: ${formatCurrency(unit)} cada`)
    }
    rows.push(`Subtotal: ${formatCurrency(unit * line.quantity)}`)
    if (line.sku.trim()) rows.push(`SKU: ${line.sku.trim()}`)
    if (line.shortDescription.trim()) rows.push(line.shortDescription.trim())
    if (origin && line.slug) rows.push(`${origin}/produto/${line.slug}`)
    return rows.join('\n')
  })
  const total = lines.reduce((sum, line) => sum + lineUnitPrice(line.price, line.promotionalPrice) * line.quantity, 0)
  const count = lines.reduce((sum, line) => sum + line.quantity, 0)
  return [
    `Olá! Quero finalizar este pedido${storeName ? ` na ${storeName}` : ''}:`,
    '',
    blocks.join('\n\n'),
    '',
    `*Total: ${formatCurrency(total)}*`,
    `${count} ${count === 1 ? 'item' : 'itens'}`,
    '',
    'Podem me atender para concluir?',
  ].join('\n')
}

export function productInquiryMessage(product: Product, categoryLabel: string, pageUrl: string): string {
  const lines = ['Olá! Quero saber mais sobre este produto:', '', `*${product.name}*`]
  if (categoryLabel) lines.push(categoryLabel)
  if (isOnSale(product)) {
    lines.push(`${formatCurrency(effectivePrice(product))} (de ${formatCurrency(product.price)})`)
  } else {
    lines.push(formatCurrency(product.price))
  }
  const summary = product.shortDescription.trim()
  if (summary) lines.push(summary)
  const sku = product.sku.trim()
  if (sku) lines.push(`SKU: ${sku}`)
  if (pageUrl) lines.push('', pageUrl)
  return lines.join('\n')
}

export function filterProducts(products: Product[], categories: Category[], filters: CatalogFilters): Product[] {
  const term = filters.query.trim().toLowerCase()
  const filtered = products.filter((product) => {
    if (filters.categoryId && product.categoryId !== filters.categoryId) return false
    if (filters.featuredOnly && !product.featured) return false
    if (filters.promoOnly && !isOnSale(product)) return false
    if (!term) return true
    const haystack = [product.name, product.brand, categoryName(categories, product.categoryId), product.tags.join(' ')]
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })
  return sortProducts(filtered, filters.sort)
}

export function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const next = [...products]
  if (sort === 'price-asc') next.sort((a, b) => effectivePrice(a) - effectivePrice(b))
  if (sort === 'price-desc') next.sort((a, b) => effectivePrice(b) - effectivePrice(a))
  if (sort === 'name') next.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  if (sort === 'recent') next.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  return next
}

export function relatedProducts(products: Product[], current: Product, limit = 4): Product[] {
  const sameCategory = products.filter((product) => product.id !== current.id && product.categoryId === current.categoryId)
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit)
  const rest = products.filter((product) => product.id !== current.id && product.categoryId !== current.categoryId)
  return [...sameCategory, ...rest].slice(0, limit)
}

export function isProductSort(value: string | null): value is ProductSort {
  return value === 'recent' || value === 'price-asc' || value === 'price-desc' || value === 'name'
}

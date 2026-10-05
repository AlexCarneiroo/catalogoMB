import type { CatalogFilters, Category, Product, ProductSort } from '@/types/models'

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

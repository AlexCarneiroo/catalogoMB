import type { Product, ProductDraft, ProductImageDraft } from '@/types/models'
import { formatPriceInput, parsePrice, slugify } from '@/utils/format'

export function emptyProductDraft(): ProductDraft {
  return {
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    price: '',
    promotionalPrice: '',
    images: [],
    brand: '',
    sku: '',
    code: '',
    tags: '',
    ingredients: '',
    howToUse: '',
    benefits: '',
    weight: '',
    dimensions: '',
    stock: '',
    active: true,
    featured: false,
    isNew: false,
    seoTitle: '',
    seoDescription: '',
  }
}

export function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    categoryId: product.categoryId,
    price: formatPriceInput(product.price),
    promotionalPrice: formatPriceInput(product.promotionalPrice),
    images: product.images.map((image, index) => ({
      key: image.path || `${product.id}-${index}`,
      url: image.url,
      path: image.path,
      isMain: product.mainImage ? image.url === product.mainImage : index === 0,
    })),
    brand: product.brand,
    sku: product.sku,
    code: product.code,
    tags: product.tags.join(', '),
    ingredients: product.ingredients,
    howToUse: product.howToUse,
    benefits: product.benefits,
    weight: product.weight,
    dimensions: product.dimensions,
    stock: product.stock === null ? '' : String(product.stock),
    active: product.active,
    featured: product.featured,
    isNew: product.isNew,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  }
}

export function validateProductDraft(draft: ProductDraft): string | null {
  if (!draft.name.trim()) return 'Informe o nome do produto.'
  if (!slugify(draft.slug || draft.name)) return 'Informe um slug válido.'
  if (!draft.categoryId) return 'Escolha uma categoria.'
  const price = parsePrice(draft.price)
  if (price === null || price <= 0) return 'Informe um preço maior que zero.'
  if (draft.promotionalPrice.trim()) {
    const promotionalPrice = parsePrice(draft.promotionalPrice)
    if (promotionalPrice === null) return 'O preço promocional é inválido.'
    if (promotionalPrice >= price) return 'O preço promocional precisa ser menor que o preço.'
  }
  if (draft.stock.trim()) {
    const stock = Number(draft.stock.replace(',', '.'))
    if (!Number.isInteger(stock) || stock < 0) return 'O estoque precisa ser um número inteiro a partir de zero.'
  }
  if (draft.images.length > 8) return 'Use no máximo 8 fotos.'
  return null
}

export function orderedDraftImages(images: ProductImageDraft[]): ProductImageDraft[] {
  const main = images.find((image) => image.isMain) ?? images[0]
  if (!main) return []
  return [main, ...images.filter((image) => image.key !== main.key)]
}

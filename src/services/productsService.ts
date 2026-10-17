import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { collections } from '@/firebase/collections'
import { getDb } from '@/firebase/client'
import { readPreview, shouldUsePreview, writePreview } from '@/services/previewStore'
import { mapProduct, withProductColors } from '@/services/mappers'
import { orderedDraftImages, savedColors, validateProductDraft } from '@/services/productDraft'
import { copyImage, deleteImage, uploadImage } from '@/services/storageService'
import type { Product, ProductDraft, ProductImage } from '@/types/models'
import { invalidatePublicData, readCache, writeCache } from '@/utils/cache'
import { parsePrice, slugify } from '@/utils/format'
import { createCode, createSku } from '@/utils/productCodes'

const CACHE_KEY = 'public:products'

function products() {
  return collection(getDb(), collections.products)
}

function sortByRecent(items: Product[]): Product[] {
  return [...items].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}

export async function listActiveProducts(): Promise<Product[]> {
  if (shouldUsePreview()) {
    return readPreview().products.filter((item) => item.active).map(withProductColors).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }
  const cached = readCache<Product[]>(CACHE_KEY)
  if (cached) return cached.map(withProductColors)
  const snapshot = await getDocs(query(products(), where('active', '==', true), limit(300)))
  const items = sortByRecent(snapshot.docs.map((item) => mapProduct(item.id, item.data())))
  writeCache(CACHE_KEY, items)
  return items
}

export async function listAllProducts(): Promise<Product[]> {
  if (shouldUsePreview()) {
    return readPreview().products.map(withProductColors).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  }
  const snapshot = await getDocs(query(products(), orderBy('createdAt', 'desc')))
  return snapshot.docs.map((item) => mapProduct(item.id, item.data()))
}

export async function getProduct(id: string): Promise<Product | null> {
  if (shouldUsePreview()) {
    const found = readPreview().products.find((item) => item.id === id)
    return found ? withProductColors(found) : null
  }
  const snapshot = await getDoc(doc(getDb(), collections.products, id))
  return snapshot.exists() ? mapProduct(snapshot.id, snapshot.data()) : null
}

export async function getActiveProductBySlug(slug: string): Promise<Product | null> {
  const items = await listActiveProducts()
  return items.find((product) => product.slug === slug) ?? null
}

export async function getAnyProductBySlug(slug: string): Promise<Product | null> {
  if (shouldUsePreview()) {
    const found = readPreview().products.find((item) => item.slug === slug)
    return found ? withProductColors(found) : null
  }
  const snapshot = await getDocs(query(products(), where('slug', '==', slug), limit(1)))
  const first = snapshot.docs[0]
  return first ? mapProduct(first.id, first.data()) : null
}

export async function countProductsInCategory(categoryId: string): Promise<number> {
  if (shouldUsePreview()) return readPreview().products.filter((item) => item.categoryId === categoryId).length
  const snapshot = await getDocs(query(products(), where('categoryId', '==', categoryId), limit(1)))
  return snapshot.size
}

function readStock(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const stock = Number(trimmed.replace(',', '.'))
  return Number.isInteger(stock) ? stock : null
}

async function identifierTaken(field: 'sku' | 'code', value: string, ignoreId?: string): Promise<boolean> {
  const expected = value.trim().toUpperCase()
  if (!expected) return false
  if (shouldUsePreview()) {
    return readPreview().products.some((item) => item[field].trim().toUpperCase() === expected && item.id !== ignoreId)
  }
  const snapshot = await getDocs(query(products(), where(field, '==', expected), limit(4)))
  return snapshot.docs.some((item) => item.id !== ignoreId)
}

async function keepOrCreate(current: string, field: 'sku' | 'code', create: () => string, ignoreId?: string): Promise<string> {
  const existing = current.trim().toUpperCase()
  if (existing && !(await identifierTaken(field, existing, ignoreId))) return existing
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const next = create()
    if (!(await identifierTaken(field, next, ignoreId))) return next
  }
  return create()
}

async function slugTaken(slug: string, ignoreId?: string): Promise<boolean> {
  if (shouldUsePreview()) return readPreview().products.some((item) => item.slug === slug && item.id !== ignoreId)
  const snapshot = await getDocs(query(products(), where('slug', '==', slug), limit(8)))
  return snapshot.docs.some((item) => item.id !== ignoreId)
}

async function persistImages(productId: string, draft: ProductDraft, previousPaths: string[]): Promise<ProductImage[]> {
  const images: ProductImage[] = []
  for (const [order, image] of orderedDraftImages(draft.images).entries()) {
    if (image.file) {
      const uploaded = await uploadImage(image.file, `products/${productId}`)
      images.push({ url: uploaded.url, path: uploaded.path, order })
    } else if (image.url) {
      images.push({ url: image.url, path: image.path, order })
    }
  }
  const kept = new Set(images.map((image) => image.path))
  await Promise.all(previousPaths.filter((path) => path && !kept.has(path)).map((path) => deleteImage(path)))
  return images
}

export async function saveProduct(productId: string | null, draft: ProductDraft, previousPaths: string[]): Promise<Product> {
  const validation = validateProductDraft(draft)
  if (validation) throw new Error(validation)
  const slug = slugify(draft.slug || draft.name)
  if (await slugTaken(slug, productId ?? undefined)) throw new Error('Já existe um produto com este slug.')
  const sku = await keepOrCreate(draft.sku, 'sku', createSku, productId ?? undefined)
  const code = await keepOrCreate(draft.code, 'code', createCode, productId ?? undefined)

  if (shouldUsePreview()) {
    const id = productId ?? `p-${Date.now()}`
    const images = await persistImages(id, draft, previousPaths)
    const price = parsePrice(draft.price) ?? 0
    const db = readPreview()
    const previous = db.products.find((item) => item.id === id)
    const saved: Product = {
      id,
      name: draft.name.trim(),
      slug,
      description: draft.description.trim(),
      shortDescription: draft.shortDescription.trim(),
      categoryId: draft.categoryId,
      price,
      promotionalPrice: draft.promotionalPrice.trim() ? parsePrice(draft.promotionalPrice) : null,
      images,
      mainImage: images[0]?.url ?? '',
      brand: draft.brand.trim(),
      sku,
      code,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      colors: savedColors(draft),
      ingredients: draft.ingredients.trim(),
      howToUse: draft.howToUse.trim(),
      benefits: draft.benefits.trim(),
      weight: draft.weight.trim(),
      dimensions: draft.dimensions.trim(),
      stock: readStock(draft.stock),
      active: draft.active,
      featured: draft.featured,
      isNew: draft.isNew,
      seoTitle: draft.seoTitle.trim(),
      seoDescription: draft.seoDescription.trim(),
      createdAt: previous?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }
    writePreview({ ...db, products: previous ? db.products.map((item) => (item.id === id ? saved : item)) : [saved, ...db.products] })
    return saved
  }

  const id = productId ?? doc(products()).id
  const images = await persistImages(id, draft, previousPaths)
  const price = parsePrice(draft.price) ?? 0
  await setDoc(
    doc(getDb(), collections.products, id),
    {
      name: draft.name.trim(),
      slug,
      description: draft.description.trim(),
      shortDescription: draft.shortDescription.trim(),
      categoryId: draft.categoryId,
      price,
      promotionalPrice: draft.promotionalPrice.trim() ? parsePrice(draft.promotionalPrice) : null,
      images,
      mainImage: images[0]?.url ?? '',
      brand: draft.brand.trim(),
      sku,
      code,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      colors: savedColors(draft),
      ingredients: draft.ingredients.trim(),
      howToUse: draft.howToUse.trim(),
      benefits: draft.benefits.trim(),
      weight: draft.weight.trim(),
      dimensions: draft.dimensions.trim(),
      stock: readStock(draft.stock),
      active: draft.active,
      featured: draft.featured,
      isNew: draft.isNew,
      seoTitle: draft.seoTitle.trim(),
      seoDescription: draft.seoDescription.trim(),
      updatedAt: serverTimestamp(),
      ...(productId ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  invalidatePublicData()
  const saved = await getProduct(id)
  if (!saved) throw new Error('O produto foi salvo, mas não pôde ser recarregado.')
  return saved
}

export async function updateProductFlags(id: string, flags: Partial<Pick<Product, 'active' | 'featured'>>): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({
      ...db,
      products: db.products.map((item) => (item.id === id ? { ...item, ...flags, updatedAt: Date.now() } : item)),
    })
    return
  }
  await updateDoc(doc(getDb(), collections.products, id), { ...flags, updatedAt: serverTimestamp() })
  invalidatePublicData()
}

export async function updateProductStock(id: string, stock: number | null): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({
      ...db,
      products: db.products.map((item) => (item.id === id ? { ...item, stock, updatedAt: Date.now() } : item)),
    })
    return
  }
  await updateDoc(doc(getDb(), collections.products, id), { stock, updatedAt: serverTimestamp() })
  invalidatePublicData()
}

export async function removeProduct(product: Product): Promise<void> {
  if (shouldUsePreview()) {
    const db = readPreview()
    writePreview({ ...db, products: db.products.filter((item) => item.id !== product.id) })
    return
  }
  await Promise.all(product.images.map((image) => deleteImage(image.path)))
  await deleteDoc(doc(getDb(), collections.products, product.id))
  invalidatePublicData()
}

export async function duplicateProduct(id: string): Promise<string> {
  const original = await getProduct(id)
  if (!original) throw new Error('Produto não encontrado.')
  if (shouldUsePreview()) {
    const db = readPreview()
    let slug = `${original.slug}-copia`
    let suffix = 2
    while (db.products.some((item) => item.slug === slug)) {
      slug = `${original.slug}-copia-${suffix}`
      suffix += 1
    }
    const copyId = `p-${Date.now()}`
    const sku = await keepOrCreate('', 'sku', createSku)
    const code = await keepOrCreate('', 'code', createCode)
    const copy: Product = {
      ...original,
      id: copyId,
      name: `${original.name} (cópia)`,
      slug,
      sku,
      code,
      active: false,
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    writePreview({ ...db, products: [copy, ...db.products] })
    return copyId
  }
  const reference = doc(products())
  const images: ProductImage[] = []
  for (const [order, image] of original.images.entries()) {
    if (!image.path) {
      images.push({ ...image, order })
      continue
    }
    const copied = await copyImage(image.path, `products/${reference.id}`)
    images.push({ url: copied.url, path: copied.path, order })
  }
  let slug = `${original.slug}-copia`
  let suffix = 2
  while (await slugTaken(slug)) {
    slug = `${original.slug}-copia-${suffix}`
    suffix += 1
  }
  await setDoc(reference, {
    name: `${original.name} (cópia)`,
    slug,
    description: original.description,
    shortDescription: original.shortDescription,
    categoryId: original.categoryId,
    price: original.price,
    promotionalPrice: original.promotionalPrice,
    images,
    mainImage: images[0]?.url ?? '',
    brand: original.brand,
    sku: await keepOrCreate('', 'sku', createSku),
    code: await keepOrCreate('', 'code', createCode),
    tags: original.tags,
    colors: original.colors,
    ingredients: original.ingredients,
    howToUse: original.howToUse,
    benefits: original.benefits,
    weight: original.weight,
    dimensions: original.dimensions,
    stock: original.stock,
    active: false,
    featured: false,
    isNew: original.isNew,
    seoTitle: original.seoTitle,
    seoDescription: original.seoDescription,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  invalidatePublicData()
  return reference.id
}

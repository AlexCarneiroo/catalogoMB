import type { Banner, Category, Product, ProductImage, StoreSettings } from '@/types/models'
import { defaultSettings } from '@/types/models'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(data: Record<string, unknown>, key: string, fallback = ''): string {
  const value = data[key]
  return typeof value === 'string' ? value : fallback
}

function readNumber(data: Record<string, unknown>, key: string, fallback = 0): number {
  const value = data[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readBoolean(data: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = data[key]
  return typeof value === 'boolean' ? value : fallback
}

function readNullableNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key]
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readStringList(data: Record<string, unknown>, key: string): string[] {
  const value = data[key]
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function readMillis(value: unknown): number | null {
  if (!isRecord(value)) return null
  const toMillis = value.toMillis
  if (typeof toMillis !== 'function') return null
  const result = toMillis.call(value) as unknown
  return typeof result === 'number' ? result : null
}

function readImages(data: Record<string, unknown>): ProductImage[] {
  const value = data.images
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item, index) => {
      if (!isRecord(item)) return []
      const url = readString(item, 'url')
      if (!url) return []
      return [{ url, path: readString(item, 'path'), order: readNumber(item, 'order', index) }]
    })
    .sort((a, b) => a.order - b.order)
}

export function mapProduct(id: string, raw: unknown): Product {
  const data = isRecord(raw) ? raw : {}
  const images = readImages(data)
  return {
    id,
    name: readString(data, 'name'),
    slug: readString(data, 'slug'),
    description: readString(data, 'description'),
    shortDescription: readString(data, 'shortDescription'),
    categoryId: readString(data, 'categoryId'),
    price: readNumber(data, 'price'),
    promotionalPrice: readNullableNumber(data, 'promotionalPrice'),
    images,
    mainImage: readString(data, 'mainImage', images[0]?.url ?? ''),
    brand: readString(data, 'brand'),
    sku: readString(data, 'sku'),
    code: readString(data, 'code'),
    tags: readStringList(data, 'tags'),
    ingredients: readString(data, 'ingredients'),
    howToUse: readString(data, 'howToUse'),
    benefits: readString(data, 'benefits'),
    weight: readString(data, 'weight'),
    dimensions: readString(data, 'dimensions'),
    stock: readNullableNumber(data, 'stock'),
    active: readBoolean(data, 'active'),
    featured: readBoolean(data, 'featured'),
    isNew: readBoolean(data, 'isNew'),
    seoTitle: readString(data, 'seoTitle'),
    seoDescription: readString(data, 'seoDescription'),
    createdAt: readMillis(data.createdAt),
    updatedAt: readMillis(data.updatedAt),
  }
}

export function mapCategory(id: string, raw: unknown): Category {
  const data = isRecord(raw) ? raw : {}
  return {
    id,
    name: readString(data, 'name'),
    slug: readString(data, 'slug'),
    description: readString(data, 'description'),
    image: readString(data, 'image'),
    imagePath: readString(data, 'imagePath'),
    active: readBoolean(data, 'active'),
    order: readNumber(data, 'order'),
    createdAt: readMillis(data.createdAt),
    updatedAt: readMillis(data.updatedAt),
  }
}

export function mapBanner(id: string, raw: unknown): Banner {
  const data = isRecord(raw) ? raw : {}
  return {
    id,
    title: readString(data, 'title'),
    subtitle: readString(data, 'subtitle'),
    buttonText: readString(data, 'buttonText'),
    link: readString(data, 'link', '/produtos'),
    image: readString(data, 'image'),
    imagePath: readString(data, 'imagePath'),
    order: readNumber(data, 'order'),
    active: readBoolean(data, 'active'),
    createdAt: readMillis(data.createdAt),
    updatedAt: readMillis(data.updatedAt),
  }
}

export function mapSettings(raw: unknown): StoreSettings {
  const data = isRecord(raw) ? raw : {}
  return {
    storeName: readString(data, 'storeName', defaultSettings.storeName),
    logo: readString(data, 'logo'),
    logoPath: readString(data, 'logoPath'),
    favicon: readString(data, 'favicon'),
    faviconPath: readString(data, 'faviconPath'),
    instagram: readString(data, 'instagram'),
    tiktok: readString(data, 'tiktok'),
    facebook: readString(data, 'facebook'),
    whatsapp: readString(data, 'whatsapp'),
    email: readString(data, 'email'),
    phone: readString(data, 'phone'),
    address: readString(data, 'address'),
    businessHours: readString(data, 'businessHours'),
    aboutTitle: readString(data, 'aboutTitle', defaultSettings.aboutTitle),
    aboutText: readString(data, 'aboutText'),
    aboutImage: readString(data, 'aboutImage'),
    aboutImagePath: readString(data, 'aboutImagePath'),
    history: readString(data, 'history'),
    values: readString(data, 'values'),
    seoDescription: readString(data, 'seoDescription', defaultSettings.seoDescription),
    announcementActive: readBoolean(data, 'announcementActive'),
    announcementTitle: readString(data, 'announcementTitle'),
    announcementText: readString(data, 'announcementText'),
    announcementButtonText: readString(data, 'announcementButtonText'),
    announcementLink: readString(data, 'announcementLink', '/produtos'),
    announcementVersion: readNumber(data, 'announcementVersion', 1),
    feedbackEnabled: readBoolean(data, 'feedbackEnabled', true),
  }
}

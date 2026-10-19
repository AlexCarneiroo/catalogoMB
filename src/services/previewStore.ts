import { demoBanners, demoCategories, demoProducts, demoSettings, demoTestimonials } from '@/data/demoCatalog'
import { isFirebaseConfigured } from '@/firebase/client'
import type { Banner, Category, Product, StoreSettings, Testimonial } from '@/types/models'
import { invalidatePublicData } from '@/utils/cache'

export function shouldUsePreview(): boolean {
  if (!isFirebaseConfigured()) return true
  if (import.meta.env.PROD) return false
  return import.meta.env.VITE_USE_SAMPLE_CATALOG !== 'false'
}

const KEY = 'mabelle-preview-v1'

const removedDemoProductIds = new Set([
  'p-batom',
  'p-paleta',
  'p-blush',
  'p-serum',
  'p-creme',
  'p-perfume',
  'p-oleo',
  'p-pinceis',
])

export function isRemovedDemoProduct(id: string): boolean {
  return removedDemoProductIds.has(id)
}

export type PreviewDb = {
  products: Product[]
  categories: Category[]
  banners: Banner[]
  settings: StoreSettings
  testimonials: Testimonial[]
}

function seed(): PreviewDb {
  return {
    products: demoProducts,
    categories: demoCategories,
    banners: demoBanners,
    settings: demoSettings,
    testimonials: demoTestimonials,
  }
}

export function readPreview(): PreviewDb {
  const fresh = seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh
    const parsed = JSON.parse(raw) as Partial<PreviewDb>
    if (!Array.isArray(parsed.products) || !parsed.settings) return fresh
    const products = parsed.products.filter((item) => !removedDemoProductIds.has(item.id))
    const banners = (Array.isArray(parsed.banners) ? parsed.banners : fresh.banners).map((banner) =>
      banner.link.startsWith('/produto/') ? { ...banner, link: '/produtos', buttonText: banner.buttonText === 'Ver perfume' ? 'Ver catálogo' : banner.buttonText } : banner,
    )
    const settings = { ...fresh.settings, ...parsed.settings }
    if (settings.announcementText.includes('batom veludo') || settings.announcementText.includes('paleta crepúsculo')) {
      settings.announcementText = fresh.settings.announcementText
    }
    const db: PreviewDb = {
      products,
      categories: Array.isArray(parsed.categories) ? parsed.categories : fresh.categories,
      banners,
      settings,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : fresh.testimonials,
    }
    const bannersChanged = JSON.stringify(banners) !== JSON.stringify(parsed.banners)
    const announcementChanged = settings.announcementText !== parsed.settings.announcementText
    if (products.length !== parsed.products.length || bannersChanged || announcementChanged) writePreview(db)
    return db
  } catch {
    return fresh
  }
}

export function writePreview(db: PreviewDb): void {
  localStorage.setItem(KEY, JSON.stringify(db))
  invalidatePublicData()
}

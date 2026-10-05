import { demoBanners, demoCategories, demoProducts, demoSettings, demoTestimonials } from '@/data/demoCatalog'
import { isFirebaseConfigured } from '@/firebase/client'
import type { Banner, Category, Product, StoreSettings, Testimonial } from '@/types/models'
import { invalidatePublicData } from '@/utils/cache'

export function shouldUsePreview(): boolean {
  if (!isFirebaseConfigured()) return true
  return import.meta.env.VITE_USE_SAMPLE_CATALOG !== 'false'
}

const KEY = 'mabelle-preview-v1'

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
    return {
      products: parsed.products,
      categories: Array.isArray(parsed.categories) ? parsed.categories : fresh.categories,
      banners: Array.isArray(parsed.banners) ? parsed.banners : fresh.banners,
      settings: { ...fresh.settings, ...parsed.settings },
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : fresh.testimonials,
    }
  } catch {
    return fresh
  }
}

export function writePreview(db: PreviewDb): void {
  localStorage.setItem(KEY, JSON.stringify(db))
  invalidatePublicData()
}

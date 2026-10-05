export type ProductImage = {
  url: string
  path: string
  order: number
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  categoryId: string
  price: number
  promotionalPrice: number | null
  images: ProductImage[]
  mainImage: string
  brand: string
  sku: string
  code: string
  tags: string[]
  ingredients: string
  howToUse: string
  benefits: string
  weight: string
  dimensions: string
  stock: number | null
  active: boolean
  featured: boolean
  isNew: boolean
  seoTitle: string
  seoDescription: string
  createdAt: number | null
  updatedAt: number | null
}

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  image: string
  imagePath: string
  active: boolean
  order: number
  createdAt: number | null
  updatedAt: number | null
}

export type Banner = {
  id: string
  title: string
  subtitle: string
  buttonText: string
  link: string
  image: string
  imagePath: string
  order: number
  active: boolean
  createdAt: number | null
  updatedAt: number | null
}

export type StoreSettings = {
  storeName: string
  logo: string
  logoPath: string
  favicon: string
  faviconPath: string
  instagram: string
  tiktok: string
  facebook: string
  whatsapp: string
  email: string
  phone: string
  address: string
  businessHours: string
  aboutTitle: string
  aboutText: string
  aboutImage: string
  aboutImagePath: string
  history: string
  values: string
  seoDescription: string
  announcementActive: boolean
  announcementTitle: string
  announcementText: string
  announcementButtonText: string
  announcementLink: string
  announcementVersion: number
  feedbackEnabled: boolean
}

export type LocalImage = {
  url: string
  path: string
  file?: File
}

export type ProductImageDraft = LocalImage & {
  key: string
  isMain: boolean
}

export type ProductDraft = {
  name: string
  slug: string
  description: string
  shortDescription: string
  categoryId: string
  price: string
  promotionalPrice: string
  images: ProductImageDraft[]
  brand: string
  sku: string
  code: string
  tags: string
  ingredients: string
  howToUse: string
  benefits: string
  weight: string
  dimensions: string
  stock: string
  active: boolean
  featured: boolean
  isNew: boolean
  seoTitle: string
  seoDescription: string
}

export type Testimonial = {
  id: string
  name: string
  text: string
  detail: string
  active: boolean
  order: number
  createdAt: number | null
}

export type ProductSort = 'recent' | 'price-asc' | 'price-desc' | 'name'

export type CatalogFilters = {
  query: string
  categoryId: string
  sort: ProductSort
  featuredOnly: boolean
  promoOnly: boolean
}

export const defaultSettings: StoreSettings = {
  storeName: 'Mabelle Make',
  logo: '',
  logoPath: '',
  favicon: '',
  faviconPath: '',
  instagram: '',
  tiktok: '',
  facebook: '',
  whatsapp: '',
  email: '',
  phone: '',
  address: '',
  businessHours: '',
  aboutTitle: 'A casa',
  aboutText: '',
  aboutImage: '',
  aboutImagePath: '',
  history: '',
  values: '',
  seoDescription: 'Produtos de beleza selecionados para uma rotina mais elegante.',
  announcementActive: false,
  announcementTitle: '',
  announcementText: '',
  announcementButtonText: '',
  announcementLink: '/produtos',
  announcementVersion: 1,
  feedbackEnabled: true,
}

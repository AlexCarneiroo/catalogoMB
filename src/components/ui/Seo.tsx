import { Helmet } from 'react-helmet-async'
import { useStore } from '@/contexts/StoreContext'

type SeoProps = {
  title?: string
  description?: string
  image?: string
  path?: string
  jsonLd?: Record<string, unknown>
}

export function Seo({ title, description, image, path = '/', jsonLd }: SeoProps) {
  const { settings } = useStore()
  const storeName = settings.storeName || 'Mabelle Make'
  const fullTitle = !title || title === storeName ? storeName : `${title} · ${storeName}`
  const text = description || settings.seoDescription
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const url = `${origin}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={text} />
      <link rel="canonical" href={url} />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content={storeName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={text} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Helmet>
  )
}

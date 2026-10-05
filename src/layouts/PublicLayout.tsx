import { useEffect } from 'react'
import { Outlet, useLocation, type Location } from 'react-router-dom'
import { Suspense } from 'react'
import { AnnouncementModal } from '@/components/catalog/AnnouncementModal'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Spinner } from '@/components/ui/Feedback'
import { useStore } from '@/contexts/StoreContext'

export function PublicLayout() {
  const { settings } = useStore()
  const location = useLocation()
  const background = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation
  const page = background ?? location
  const home = page.pathname === '/'

  useEffect(() => {
    const href = settings.favicon || '/brand/monogram.png'
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = href
  }, [settings.favicon])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className={home ? 'flex-1' : 'flex-1 pt-28'}>
        <Suspense fallback={<Spinner />}>
          <div key={page.pathname} className="page-enter">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
      <AnnouncementModal />
    </div>
  )
}

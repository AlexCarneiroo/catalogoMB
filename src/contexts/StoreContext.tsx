import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isFirebaseConfigured } from '@/firebase/client'
import { listActiveBanners } from '@/services/bannersService'
import { listActiveCategories } from '@/services/categoriesService'
import { getSettings } from '@/services/settingsService'
import { defaultSettings, type Banner, type Category, type StoreSettings } from '@/types/models'
import { PUBLIC_DATA_EVENT } from '@/utils/cache'
import { getErrorMessage } from '@/utils/errors'

type StoreState = {
  configured: boolean
  settings: StoreSettings
  categories: Category[]
  banners: Banner[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const StoreContext = createContext<StoreState | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured()
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings)
  const [categories, setCategories] = useState<Category[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    try {
      const [nextSettings, nextCategories, nextBanners] = await Promise.all([
        getSettings(),
        listActiveCategories(),
        listActiveBanners(),
      ])
      setSettings(nextSettings)
      setCategories(nextCategories)
      setBanners(nextBanners)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload(false)
  }, [reload])

  useEffect(() => {
    const onInvalidate = () => {
      void reload(true)
    }
    window.addEventListener(PUBLIC_DATA_EVENT, onInvalidate)
    return () => window.removeEventListener(PUBLIC_DATA_EVENT, onInvalidate)
  }, [reload])

  const value = useMemo<StoreState>(
    () => ({ configured, settings, categories, banners, loading, error, reload: () => reload(true) }),
    [configured, settings, categories, banners, loading, error, reload],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreState {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore precisa estar dentro de StoreProvider.')
  return value
}

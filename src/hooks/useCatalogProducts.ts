import { useCallback, useEffect, useState } from 'react'
import { listActiveProducts } from '@/services/productsService'
import type { Product } from '@/types/models'
import { PUBLIC_DATA_EVENT } from '@/utils/cache'
import { getErrorMessage } from '@/utils/errors'

export function useCatalogProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await listActiveProducts())
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const onInvalidate = () => {
      void reload()
    }
    window.addEventListener(PUBLIC_DATA_EVENT, onInvalidate)
    return () => window.removeEventListener(PUBLIC_DATA_EVENT, onInvalidate)
  }, [reload])

  return { products, loading, error }
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartLine, Product } from '@/types/models'
import { lineUnitPrice } from '@/utils/catalog'

const storageKey = 'mabelle-cart-v1'

type CartContextValue = {
  lines: CartLine[]
  count: number
  total: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (product: Product, category: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function stockCap(stock: number | null): number {
  if (stock === null) return 99
  return Math.max(0, Math.floor(stock))
}

function snapshot(product: Product, category: string, quantity: number): CartLine {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.mainImage || product.images[0]?.url || '',
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    sku: product.sku,
    category,
    shortDescription: product.shortDescription,
    stock: product.stock,
    quantity,
  }
}

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CartLine => {
      if (!item || typeof item !== 'object') return false
      const line = item as Partial<CartLine>
      return typeof line.productId === 'string' && typeof line.name === 'string' && typeof line.quantity === 'number' && line.quantity > 0
    }).map((line) => ({
      productId: line.productId,
      slug: line.slug || '',
      name: line.name,
      image: line.image || '',
      price: typeof line.price === 'number' ? line.price : 0,
      promotionalPrice: typeof line.promotionalPrice === 'number' ? line.promotionalPrice : null,
      sku: line.sku || '',
      category: line.category || '',
      shortDescription: line.shortDescription || '',
      stock: typeof line.stock === 'number' ? line.stock : null,
      quantity: Math.min(stockCap(typeof line.stock === 'number' ? line.stock : null), Math.floor(line.quantity)),
    }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readCart())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lines))
  }, [lines])

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0)
    const total = lines.reduce((sum, line) => sum + lineUnitPrice(line.price, line.promotionalPrice) * line.quantity, 0)
    return {
      lines,
      count,
      total,
      open,
      setOpen,
      add(product, category, quantity = 1) {
        const amount = Math.max(1, Math.floor(quantity))
        setLines((current) => {
          const cap = stockCap(product.stock)
          const existing = current.find((line) => line.productId === product.id)
          const nextQuantity = Math.min(cap, (existing?.quantity ?? 0) + amount)
          if (nextQuantity <= 0) return current
          const line = snapshot(product, category, nextQuantity)
          if (!existing) return [...current, line]
          return current.map((item) => (item.productId === product.id ? line : item))
        })
      },
      setQuantity(productId, quantity) {
        setLines((current) => {
          const line = current.find((item) => item.productId === productId)
          if (!line) return current
          const next = Math.min(stockCap(line.stock), Math.floor(quantity))
          if (next <= 0) return current.filter((item) => item.productId !== productId)
          return current.map((item) => (item.productId === productId ? { ...item, quantity: next } : item))
        })
      },
      remove(productId) {
        setLines((current) => current.filter((line) => line.productId !== productId))
      },
      clear() {
        setLines([])
      },
    }
  }, [lines, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart precisa estar dentro de CartProvider')
  return context
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useToast } from '@/contexts/ToastContext'
import type { CartLine, Product, ProductColor } from '@/types/models'
import { lineUnitPrice } from '@/utils/catalog'

const storageKey = 'mabelle-cart-v1'

type CartContextValue = {
  lines: CartLine[]
  count: number
  total: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (product: Product, category: string, quantity?: number, color?: ProductColor | null) => void
  setQuantity: (productId: string, colorId: string, quantity: number) => void
  remove: (productId: string, colorId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function stockCap(stock: number | null): number {
  if (stock === null) return 99
  return Math.max(0, Math.floor(stock))
}

function sameLine(line: CartLine, productId: string, colorId: string): boolean {
  return line.productId === productId && line.colorId === colorId
}

function usedByProduct(lines: CartLine[], productId: string): number {
  return lines.filter((line) => line.productId === productId).reduce((sum, line) => sum + line.quantity, 0)
}

function snapshot(product: Product, category: string, quantity: number, color: ProductColor | null): CartLine {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.mainImage || product.images[0]?.url || '',
    price: product.price,
    promotionalPrice: product.promotionalPrice,
    sku: product.sku,
    code: product.code,
    category,
    shortDescription: product.shortDescription,
    stock: product.stock,
    colorId: color?.id ?? '',
    colorName: color?.name ?? '',
    colorHex: color?.hex ?? '',
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
      code: line.code || '',
      category: line.category || '',
      shortDescription: line.shortDescription || '',
      stock: typeof line.stock === 'number' ? line.stock : null,
      colorId: line.colorId || '',
      colorName: line.colorName || '',
      colorHex: line.colorHex || '',
      quantity: Math.min(stockCap(typeof line.stock === 'number' ? line.stock : null), Math.floor(line.quantity)),
    }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readCart())
  const [open, setOpen] = useState(false)
  const { notify } = useToast()

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
      add(product, category, quantity = 1, color = null) {
        const amount = Math.max(1, Math.floor(quantity))
        const selected = color ?? null
        if (product.colors.length > 0 && !selected) return
        const cap = stockCap(product.stock)
        const colorId = selected?.id ?? ''
        const existing = lines.find((line) => sameLine(line, product.id, colorId))
        const others = usedByProduct(lines, product.id) - (existing?.quantity ?? 0)
        const nextQuantity = Math.min(Math.max(0, cap - others), (existing?.quantity ?? 0) + amount)
        if (nextQuantity <= (existing?.quantity ?? 0)) {
          notify('Não há estoque para adicionar mais.', 'error')
          return
        }
        const line = snapshot(product, category, nextQuantity, selected)
        setLines((current) => {
          const currentLine = current.find((item) => sameLine(item, product.id, colorId))
          if (!currentLine) return [...current, line]
          return current.map((item) => (sameLine(item, product.id, colorId) ? line : item))
        })
        notify(selected ? `${product.name} (${selected.name}) adicionado ao pedido.` : `${product.name} adicionado ao pedido.`)
      },
      setQuantity(productId, colorId, quantity) {
        setLines((current) => {
          const line = current.find((item) => sameLine(item, productId, colorId))
          if (!line) return current
          const others = usedByProduct(current, productId) - line.quantity
          const next = Math.min(Math.max(0, stockCap(line.stock) - others), Math.floor(quantity))
          if (next <= 0) return current.filter((item) => !sameLine(item, productId, colorId))
          return current.map((item) => (sameLine(item, productId, colorId) ? { ...item, quantity: next } : item))
        })
      },
      remove(productId, colorId) {
        const line = lines.find((item) => sameLine(item, productId, colorId))
        setLines((current) => current.filter((item) => !sameLine(item, productId, colorId)))
        if (line) notify('Item removido do pedido.')
      },
      clear() {
        if (lines.length === 0) return
        setLines([])
        notify('Pedido esvaziado.')
      },
    }
  }, [lines, notify, open])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart precisa estar dentro de CartProvider')
  return context
}

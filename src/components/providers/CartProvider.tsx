'use client'
import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import * as store from './cart-store'
import type { CartLine } from './cart-store'

export type { CartLine } from './cart-store'

/**
 * Browser cart. Stores ONLY identifiers, quantities and a display snapshot (name/image) for instant UI.
 * Prices, stock and totals shown at cart/checkout are always recalculated on the server.
 */
export interface LastAdded {
  line: CartLine
  addedQuantity: number
  /** Event timestamp; lets UI distinguish two consecutive adds of the same line. */
  at: number
}

interface CartValue {
  lines: CartLine[]
  count: number
  /** False during SSR and the first hydration pass; true once the browser cart has been read. */
  ready: boolean
  couponCode: string
  setCouponCode: (code: string) => void
  add: (line: CartLine) => void
  setQuantity: (productId: number, variantId: string, quantity: number) => void
  remove: (productId: number, variantId: string) => void
  clear: () => void
  lastAdded: LastAdded | null
  dismissLastAdded: () => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

const CartContext = createContext<CartValue | null>(null)
const noopSubscribe = () => () => {}

export function CartProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const add = useCallback((line: CartLine) => {
    store.update((prev) => {
      const i = prev.lines.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId)
      const lines = [...prev.lines]
      if (i === -1) lines.push({ ...line, quantity: Math.min(store.MAX_QTY, line.quantity) })
      else lines[i] = { ...line, quantity: Math.min(store.MAX_QTY, prev.lines[i]!.quantity + line.quantity) }
      return { ...prev, lines }
    })
    setLastAdded({ line, addedQuantity: line.quantity, at: Date.now() })
  }, [])

  const setQuantity = useCallback((productId: number, variantId: string, quantity: number) => {
    store.update((prev) => ({
      ...prev,
      lines:
        quantity <= 0
          ? prev.lines.filter((l) => !(l.productId === productId && l.variantId === variantId))
          : prev.lines.map((l) => (l.productId === productId && l.variantId === variantId ? { ...l, quantity: Math.min(store.MAX_QTY, quantity) } : l)),
    }))
  }, [])

  const remove = useCallback((productId: number, variantId: string) => {
    store.update((prev) => ({ ...prev, lines: prev.lines.filter((l) => !(l.productId === productId && l.variantId === variantId)) }))
  }, [])

  const clear = useCallback(() => store.update(() => ({ lines: [], couponCode: '' })), [])
  const setCouponCode = useCallback((code: string) => store.update((prev) => ({ ...prev, couponCode: code })), [])
  const dismissLastAdded = useCallback(() => setLastAdded(null), [])

  const value = useMemo<CartValue>(
    () => ({
      lines: state.lines,
      count: state.lines.reduce((n, l) => n + l.quantity, 0),
      ready,
      couponCode: state.couponCode,
      setCouponCode,
      add,
      setQuantity,
      remove,
      clear,
      lastAdded,
      dismissLastAdded,
      drawerOpen,
      setDrawerOpen,
    }),
    [state, ready, setCouponCode, add, setQuantity, remove, clear, lastAdded, dismissLastAdded, drawerOpen],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

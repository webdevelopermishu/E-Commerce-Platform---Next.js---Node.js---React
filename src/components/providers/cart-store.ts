'use client'
/**
 * Browser-side cart persistence as an external store (read with useSyncExternalStore).
 * Holds ONLY identifiers, quantities and a display snapshot; prices/stock are always re-quoted on the server.
 */
export interface CartLine {
  productId: number
  variantId: string
  quantity: number
  snapshot: { name: string; variantLabel: string; slug: string; imageUrl: string | null; unitPrice: number }
}

export interface CartState {
  lines: CartLine[]
  couponCode: string
}

export const STORAGE_KEY = 'cart_v1'
export const MAX_QTY = 50
const MAX_LINES = 40
const EMPTY: CartState = Object.freeze({ lines: [], couponCode: '' }) as CartState

let cachedRaw: string | null | undefined
let cachedState: CartState = EMPTY
/** Used when localStorage is unavailable (private mode / disabled) so the cart still works for this page view. */
let memoryFallback: CartState | null = null
const listeners = new Set<() => void>()

export function parseCart(raw: string | null): CartState {
  if (!raw) return EMPTY
  try {
    const parsed = JSON.parse(raw) as { lines?: unknown; couponCode?: unknown }
    const lines = Array.isArray(parsed.lines)
      ? (parsed.lines as CartLine[]).filter(
          (l) =>
            l &&
            Number.isInteger(l.productId) &&
            typeof l.variantId === 'string' &&
            Number.isInteger(l.quantity) &&
            l.quantity > 0 &&
            typeof l.snapshot === 'object' &&
            l.snapshot !== null,
        )
      : []
    return {
      lines: lines.slice(0, MAX_LINES).map((l) => ({ ...l, quantity: Math.min(MAX_QTY, l.quantity) })),
      couponCode: typeof parsed.couponCode === 'string' ? parsed.couponCode.slice(0, 40) : '',
    }
  } catch {
    return EMPTY
  }
}

export function getSnapshot(): CartState {
  if (memoryFallback) return memoryFallback
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedState = parseCart(raw)
  }
  return cachedState
}

export function getServerSnapshot(): CartState {
  return EMPTY
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function update(fn: (prev: CartState) => CartState): void {
  const next = fn(getSnapshot())
  try {
    const raw = JSON.stringify(next)
    window.localStorage.setItem(STORAGE_KEY, raw)
    cachedRaw = raw
    cachedState = next
    memoryFallback = null
  } catch {
    memoryFallback = next
  }
  listeners.forEach((l) => l())
}

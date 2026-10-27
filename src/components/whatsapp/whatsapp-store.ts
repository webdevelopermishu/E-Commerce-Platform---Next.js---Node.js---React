'use client'
import { useEffect, useSyncExternalStore } from 'react'

/** Tiny shared store so a product page can tell the floating WhatsApp button which product is in view. */
type Ctx = { productName?: string }
let state: Ctx = {}
const listeners = new Set<() => void>()

function set(next: Ctx) {
  state = next
  listeners.forEach((l) => l())
}

export function useWhatsAppContext(): Ctx {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}

/** Render on a product page: <WhatsAppProduct name="…" /> */
export function WhatsAppProduct({ name }: { name: string }) {
  useEffect(() => {
    set({ productName: name })
    return () => set({})
  }, [name])
  return null
}

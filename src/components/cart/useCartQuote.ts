'use client'
import { useEffect, useRef, useState } from 'react'
import { quoteCartAction, type QuoteResult } from '@/app/(frontend)/actions'
import { useCart } from '../providers/CartProvider'
import { useI18n } from '../providers/I18nProvider'

interface Resolved {
  key: string
  data: QuoteResult | null
  error: boolean
}

/**
 * Ask the server to price the current cart. Debounced; ignores stale responses.
 * `loading` is derived (the latest request key has not resolved yet) rather than set inside the effect.
 */
export function useCartQuote(opts: { enabled?: boolean; district?: string; deliveryMethod?: string; withCoupon?: boolean } = {}) {
  const { lines, ready, couponCode } = useCart()
  const { locale } = useI18n()
  const [resolved, setResolved] = useState<Resolved | null>(null)
  const seq = useRef(0)
  const enabled = opts.enabled !== false
  const key = JSON.stringify([lines.map((l) => [l.productId, l.variantId, l.quantity]), couponCode, opts.district, opts.deliveryMethod, opts.withCoupon, locale])
  const active = ready && enabled && lines.length > 0

  useEffect(() => {
    if (!active) return
    const id = ++seq.current
    const timer = setTimeout(async () => {
      try {
        const res = await quoteCartAction({
          items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
          couponCode: opts.withCoupon !== false && couponCode ? couponCode : undefined,
          locale,
          district: opts.district || undefined,
          deliveryMethod: opts.deliveryMethod || undefined,
        })
        if (id !== seq.current) return
        setResolved((prev) => ('error' in res ? { key, data: prev?.data ?? null, error: true } : { key, data: res, error: false }))
      } catch {
        if (id === seq.current) setResolved((prev) => ({ key, data: prev?.data ?? null, error: true }))
      }
    }, 180)
    return () => clearTimeout(timer)
    // `key` captures every input that matters; listing lines/opts too would re-run on identity changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active])

  if (!active) return { data: null, loading: false, error: false }
  // Keep showing the previous quote while a new one is in flight (no flicker), flagged as loading.
  return { data: resolved?.data ?? null, loading: resolved?.key !== key, error: resolved?.key === key ? resolved.error : false }
}

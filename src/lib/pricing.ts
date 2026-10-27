import type { Poisha } from './money'

/** Minimal shape of a product variant needed to price it. Prices are integer poisha. */
export interface PriceableVariant {
  price: Poisha
  salePrice?: Poisha | null
  saleStartsAt?: string | Date | null
  saleEndsAt?: string | Date | null
}

export interface EffectivePrice {
  /** Price the customer pays per unit right now. */
  unitPrice: Poisha
  /** Regular price, for strike-through display. */
  regularPrice: Poisha
  onSale: boolean
  /** Whole-number discount percentage for the badge (rounded down, never overstated). */
  discountPercent: number
}

function toTime(v: string | Date | null | undefined): number | null {
  if (!v) return null
  const t = v instanceof Date ? v.getTime() : Date.parse(v)
  return Number.isNaN(t) ? null : t
}

/**
 * A sale applies only when salePrice is set, lower than the regular price,
 * and `now` falls inside the optional schedule window.
 */
export function isSaleActive(v: PriceableVariant, now: Date = new Date()): boolean {
  if (v.salePrice == null || v.salePrice <= 0 || v.salePrice >= v.price) return false
  const start = toTime(v.saleStartsAt)
  const end = toTime(v.saleEndsAt)
  const t = now.getTime()
  if (start !== null && t < start) return false
  if (end !== null && t > end) return false
  return true
}

export function effectivePrice(v: PriceableVariant, now: Date = new Date()): EffectivePrice {
  const onSale = isSaleActive(v, now)
  const unitPrice = onSale ? (v.salePrice as Poisha) : v.price
  const discountPercent = onSale ? Math.floor(((v.price - unitPrice) * 100) / v.price) : 0
  return { unitPrice, regularPrice: v.price, onSale, discountPercent }
}

import { clamp, percentOf, type Poisha } from './money'

export interface CouponRule {
  code: string
  active: boolean
  type: 'percent' | 'fixed'
  /** percent: 0–100; fixed: integer poisha */
  value: number
  minSubtotal?: Poisha | null
  maxDiscount?: Poisha | null
  startsAt?: string | Date | null
  endsAt?: string | Date | null
  usageLimit?: number | null
  usedCount?: number | null
}

export type CouponError =
  | 'coupon_not_found'
  | 'coupon_inactive'
  | 'coupon_not_started'
  | 'coupon_expired'
  | 'coupon_usage_limit'
  | 'coupon_min_subtotal'

export type CouponResult = { ok: true; discount: Poisha } | { ok: false; error: CouponError }

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

/** Evaluate a coupon against a merchandise subtotal. Never returns more than the subtotal. */
export function evaluateCoupon(
  coupon: CouponRule | null | undefined,
  subtotal: Poisha,
  now: Date = new Date(),
): CouponResult {
  if (!coupon) return { ok: false, error: 'coupon_not_found' }
  if (!coupon.active) return { ok: false, error: 'coupon_inactive' }
  const t = now.getTime()
  if (coupon.startsAt && t < new Date(coupon.startsAt).getTime()) return { ok: false, error: 'coupon_not_started' }
  if (coupon.endsAt && t > new Date(coupon.endsAt).getTime()) return { ok: false, error: 'coupon_expired' }
  if (coupon.usageLimit != null && coupon.usageLimit > 0 && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
    return { ok: false, error: 'coupon_usage_limit' }
  }
  if (coupon.minSubtotal != null && subtotal < coupon.minSubtotal) return { ok: false, error: 'coupon_min_subtotal' }

  let discount = coupon.type === 'percent' ? percentOf(subtotal, coupon.value) : Math.round(coupon.value)
  if (coupon.maxDiscount != null && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount)
  return { ok: true, discount: clamp(discount, 0, subtotal) }
}

import { describe, expect, it } from 'vitest'
import { priceCart, type CatalogProduct } from '@/lib/cart-math'
import { evaluateCoupon, normalizeCouponCode, type CouponRule } from '@/lib/coupons'
import { deliveryFee, resolveZone, type DeliveryZone } from '@/lib/delivery'

const now = new Date('2026-06-01T00:00:00Z')
const catalog = new Map<string, CatalogProduct>([
  [
    '1',
    {
      id: 1,
      slug: 'himsagar',
      name: 'Himsagar',
      published: true,
      variants: [
        { id: 'a', sku: 'H-5', label: '5 kg', price: 85000, stock: 10 },
        { id: 'b', sku: 'H-10', label: '10 kg', price: 170000, salePrice: 160000, stock: 2 },
        { id: 'c', sku: 'H-20', label: '20 kg', price: 320000, stock: 0 },
      ],
    },
  ],
  ['2', { id: 2, slug: 'hidden', name: 'Hidden', published: false, variants: [{ id: 'x', sku: 'X', label: '1', price: 1000, stock: 5 }] }],
])

const zones: DeliveryZone[] = [
  { code: 'dhaka', fee: 8000, freeOver: 300000, districts: ['dhaka'] },
  { code: 'outside', fee: 15000, isDefault: true },
]

describe('priceCart', () => {
  it('prices lines from the catalog, applying sale prices', () => {
    const t = priceCart({ items: [{ productId: 1, variantId: 'a', quantity: 2 }, { productId: '1', variantId: 'b', quantity: 1 }], catalog, now })
    expect(t.subtotal).toBe(85000 * 2 + 160000)
    expect(t.total).toBe(t.subtotal)
    expect(t.purchasable).toBe(true)
    expect(t.itemCount).toBe(3)
  })

  it('merges duplicate lines for the same variant', () => {
    const t = priceCart({ items: [{ productId: 1, variantId: 'a', quantity: 1 }, { productId: 1, variantId: 'a', quantity: 2 }], catalog, now })
    expect(t.lines).toHaveLength(1)
    expect(t.lines[0]!.quantity).toBe(3)
  })

  it('flags out-of-stock, insufficient stock, unpublished and unknown lines and excludes them from totals', () => {
    const t = priceCart({
      items: [
        { productId: 1, variantId: 'c', quantity: 1 },
        { productId: 1, variantId: 'b', quantity: 3 },
        { productId: 2, variantId: 'x', quantity: 1 },
        { productId: 1, variantId: 'nope', quantity: 1 },
        { productId: 1, variantId: 'a', quantity: 1 },
      ],
      catalog,
      now,
    })
    const issues = Object.fromEntries(t.lines.map((l) => [l.variantId, l.issue]))
    expect(issues).toEqual({ c: 'out_of_stock', b: 'insufficient_stock', x: 'product_unavailable', nope: 'variant_unavailable', a: undefined })
    expect(t.subtotal).toBe(85000)
    expect(t.purchasable).toBe(false)
  })

  it('rejects invalid quantities', () => {
    for (const quantity of [0, -1, 1.5, 51]) {
      const t = priceCart({ items: [{ productId: 1, variantId: 'a', quantity }], catalog, now })
      expect(t.lines[0]!.issue).toBe('invalid_quantity')
    }
  })

  it('adds delivery by district zone and waives it above the free-delivery threshold', () => {
    const base = { catalog, zones, now, items: [{ productId: 1, variantId: 'a', quantity: 1 }] }
    expect(priceCart({ ...base, district: 'dhaka' }).shipping).toBe(8000)
    expect(priceCart({ ...base, district: 'rajshahi' }).shipping).toBe(15000)
    const big = priceCart({ ...base, district: 'dhaka', items: [{ productId: 1, variantId: 'a', quantity: 4 }] })
    expect(big.shipping).toBe(0)
    expect(big.total).toBe(340000)
  })

  it('applies a coupon before computing delivery and the grand total', () => {
    const coupon: CouponRule = { code: 'MANGO10', active: true, type: 'percent', value: 10, maxDiscount: 20000 }
    const t = priceCart({ items: [{ productId: 1, variantId: 'a', quantity: 2 }], catalog, coupon, couponCode: 'MANGO10', zones, district: 'khulna', now })
    expect(t.discount).toBe(17000)
    expect(t.total).toBe(170000 - 17000 + 15000)
  })

  it('reports coupon errors without discounting', () => {
    const t = priceCart({ items: [{ productId: 1, variantId: 'a', quantity: 1 }], catalog, coupon: null, couponCode: 'BOGUS', now })
    expect(t.discount).toBe(0)
    expect(t.couponError).toBe('coupon_not_found')
  })
})

describe('coupons', () => {
  const base: CouponRule = { code: 'X', active: true, type: 'fixed', value: 50000 }
  it('normalizes codes', () => expect(normalizeCouponCode(' mango 10 ')).toBe('MANGO10'))
  it('never discounts more than the subtotal', () => expect(evaluateCoupon(base, 30000, now)).toEqual({ ok: true, discount: 30000 }))
  it('caps percentage coupons at maxDiscount', () => {
    expect(evaluateCoupon({ ...base, type: 'percent', value: 50, maxDiscount: 10000 }, 100000, now)).toEqual({ ok: true, discount: 10000 })
  })
  it('enforces active flag, schedule, usage limit and minimum subtotal', () => {
    expect(evaluateCoupon({ ...base, active: false }, 100000, now)).toEqual({ ok: false, error: 'coupon_inactive' })
    expect(evaluateCoupon({ ...base, startsAt: '2026-07-01' }, 100000, now)).toEqual({ ok: false, error: 'coupon_not_started' })
    expect(evaluateCoupon({ ...base, endsAt: '2026-05-01' }, 100000, now)).toEqual({ ok: false, error: 'coupon_expired' })
    expect(evaluateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, 100000, now)).toEqual({ ok: false, error: 'coupon_usage_limit' })
    expect(evaluateCoupon({ ...base, minSubtotal: 200000 }, 100000, now)).toEqual({ ok: false, error: 'coupon_min_subtotal' })
  })
})

describe('delivery zones', () => {
  it('falls back to the default zone and skips disabled zones', () => {
    expect(resolveZone(zones, 'dhaka')?.code).toBe('dhaka')
    expect(resolveZone(zones, undefined)?.code).toBe('outside')
    expect(resolveZone([{ ...zones[0]!, enabled: false }, zones[1]!], 'dhaka')?.code).toBe('outside')
  })
  it('adds the method surcharge even when the base fee is waived', () => {
    expect(deliveryFee(zones[0]!, { code: 'express', surcharge: 5000 }, 500000)).toBe(5000)
    expect(deliveryFee(null, null, 0)).toBe(0)
  })
})

import { randomUUID } from 'node:crypto'
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createOrder } from '@/server/orders/create-order'
import { getOrderWithPhone, getOrderWithToken } from '@/server/orders/lookup'
import { freshPayload, seedMinimalStore, taka, validForm } from './helpers'

let payload: Payload
let productId: number
let v5: string
let v10: string
let draftId: number
let draftVariant: string

async function stockOf(variantId: string): Promise<number> {
  const p = await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })
  return p.variants!.find((v) => v.id === variantId)!.stock!
}

const order = (items: { productId: number; variantId: string; quantity: number }[], extra: Record<string, unknown> = {}) =>
  createOrder(payload, { form: validForm, items, idempotencyKey: randomUUID(), locale: 'bn', ...extra })

beforeAll(async () => {
  payload = await freshPayload()
})

beforeEach(async () => {
  payload = await freshPayload()
  const s = await seedMinimalStore(payload)
  productId = s.product.id
  v5 = s.product.variants![0]!.id!
  v10 = s.product.variants![1]!.id!
  draftId = s.draft.id
  draftVariant = s.draft.variants![0]!.id!
})

describe('order creation', () => {
  it('prices from the database, snapshots the items and decrements stock', async () => {
    const res = await order([
      { productId, variantId: v5, quantity: 2 },
      { productId, variantId: v10, quantity: 1 },
    ])
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const doc = await payload.findByID({ collection: 'orders', id: res.orderId, depth: 0, overrideAccess: true })
    // 2 × 850 + 1 × 1600 (sale) = 3300 ≥ 3000 → free Dhaka delivery
    expect(doc.subtotal).toBe(taka(3300))
    expect(doc.shippingFee).toBe(0)
    expect(doc.total).toBe(taka(3300))
    expect(doc.items!.map((i) => [i.sku, i.quantity, i.unitPrice])).toEqual([
      ['T-HIM-5', 2, taka(850)],
      ['T-HIM-10', 1, taka(1600)],
    ])
    expect(doc.items![0]!.productName).toBe('হিমসাগর আম')
    expect(doc.paymentStatus).toBe('unpaid')
    expect(doc.status).toBe('pending')
    expect(await stockOf(v5)).toBe(3)
    expect(await stockOf(v10)).toBe(0)
  })

  it('charges the zone fee below the free-delivery threshold', async () => {
    const res = await createOrder(payload, {
      form: { ...validForm, division: 'rajshahi', district: 'rajshahi' },
      items: [{ productId, variantId: v5, quantity: 1 }],
      idempotencyKey: randomUUID(),
      locale: 'en',
    })
    expect(res.ok && res.total).toBe(taka(850 + 150))
  })

  it('keeps historical item snapshots when the product changes later', async () => {
    const res = await order([{ productId, variantId: v5, quantity: 1 }])
    if (!res.ok) throw new Error('order failed')
    await payload.update({ collection: 'products', id: productId, locale: 'bn', data: { name: 'নতুন নাম' }, overrideAccess: true })
    const doc = await payload.findByID({ collection: 'orders', id: res.orderId, depth: 0, overrideAccess: true })
    expect(doc.items![0]!.productName).toBe('হিমসাগর আম')
    expect(doc.items![0]!.unitPrice).toBe(taka(850))
  })

  it('rejects more than the available stock and leaves stock untouched', async () => {
    const res = await order([{ productId, variantId: v10, quantity: 2 }])
    expect(res).toMatchObject({ ok: false, error: 'cart_issues' })
    expect(await stockOf(v10)).toBe(1)
  })

  it('rejects unpublished products', async () => {
    const res = await order([{ productId: draftId, variantId: draftVariant, quantity: 1 }])
    expect(res).toMatchObject({ ok: false, error: 'cart_issues' })
  })

  it('returns field errors for invalid checkout data without touching stock', async () => {
    const res = await createOrder(payload, { form: { ...validForm, phone: '12345' }, items: [{ productId, variantId: v5, quantity: 1 }], idempotencyKey: randomUUID(), locale: 'bn' })
    expect(res).toMatchObject({ ok: false, error: 'invalid_input', fieldErrors: { phone: 'phone' } })
    expect(await stockOf(v5)).toBe(5)
  })

  it('never oversells under concurrent checkouts for the last unit', async () => {
    const attempts = await Promise.all(Array.from({ length: 6 }, () => order([{ productId, variantId: v10, quantity: 1 }])))
    expect(attempts.filter((r) => r.ok)).toHaveLength(1)
    expect(await stockOf(v10)).toBe(0)
    const orders = await payload.count({ collection: 'orders', overrideAccess: true })
    expect(orders.totalDocs).toBe(1)
  })

  it('returns the same order for a repeated idempotency key (double submit)', async () => {
    const input = { form: validForm, items: [{ productId, variantId: v5, quantity: 1 }], idempotencyKey: randomUUID(), locale: 'bn' as const }
    const [a, b] = await Promise.all([createOrder(payload, input), createOrder(payload, input)])
    const c = await createOrder(payload, input)
    expect(a.ok && b.ok && c.ok).toBe(true)
    if (!a.ok || !b.ok || !c.ok) return
    expect(new Set([a.orderNumber, b.orderNumber, c.orderNumber]).size).toBe(1)
    expect(await stockOf(v5)).toBe(4)
  })

  it('restores stock when an order is cancelled', async () => {
    const res = await order([{ productId, variantId: v5, quantity: 2 }])
    if (!res.ok) throw new Error('order failed')
    expect(await stockOf(v5)).toBe(3)
    await payload.update({ collection: 'orders', id: res.orderId, data: { status: 'cancelled' }, overrideAccess: true })
    expect(await stockOf(v5)).toBe(5)
  })
})

describe('order lookup', () => {
  it('requires the signed token or the matching phone number', async () => {
    const res = await order([{ productId, variantId: v5, quantity: 1 }])
    if (!res.ok) throw new Error('order failed')
    expect(await getOrderWithToken(payload, res.orderNumber, res.accessToken)).not.toBeNull()
    expect(await getOrderWithToken(payload, res.orderNumber, 'guessed-token')).toBeNull()
    expect(await getOrderWithToken(payload, res.orderNumber, undefined)).toBeNull()
    expect(await getOrderWithPhone(payload, res.orderNumber, '+8801712345678')).not.toBeNull()
    expect(await getOrderWithPhone(payload, res.orderNumber, '01999999999')).toBeNull()
  })
})

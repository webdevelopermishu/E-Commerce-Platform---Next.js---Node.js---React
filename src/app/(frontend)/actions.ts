'use server'

import { after } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { priceCart, type CartTotals } from '@/lib/cart-math'
import { normalizeCouponCode } from '@/lib/coupons'
import { resolveZone } from '@/lib/delivery'
import { clientIpFromHeaders, rateLimit } from '@/lib/rate-limit'
import { cartLineSchema, type PlaceOrderInput } from '@/lib/validation/checkout'
import { loadCatalogForCart, loadCoupon, loadDeliveryConfig } from '@/server/catalog-pricing'
import { createOrder, type PlaceOrderError } from '@/server/orders/create-order'
import { getOrderWithPhone } from '@/server/orders/lookup'
import { orderUrlPath, verifyOrderAccessToken } from '@/server/orders/tokens'
import { sendOrderNotifications } from '@/server/notifications'
import { getPayloadClient } from '@/server/payload'
import { initiatePayment } from '@/server/payments/service'
import type { GatewayId } from '@/server/payments/types'
import type { Order } from '@/payload-types'

async function ip(): Promise<string> {
  return clientIpFromHeaders(await headers())
}

const localeSchema = z.enum(['bn', 'en'])

const quoteSchema = z.object({
  items: z.array(cartLineSchema).max(40),
  couponCode: z.string().trim().max(40).optional(),
  locale: localeSchema,
  district: z.string().max(40).optional(),
  deliveryMethod: z.string().max(40).optional(),
})

export interface QuoteResult {
  totals: CartTotals
  zoneEstimate?: string
  deliveryAvailable: boolean
}

/** Authoritative cart pricing for the cart page, drawer and checkout summary. */
export async function quoteCartAction(input: z.input<typeof quoteSchema>): Promise<QuoteResult | { error: 'invalid' | 'rate_limited' }> {
  if (!rateLimit(`quote:${await ip()}`, 120, 60_000).ok) return { error: 'rate_limited' }
  const parsed = quoteSchema.safeParse(input)
  if (!parsed.success) return { error: 'invalid' }
  const { items, locale, district, deliveryMethod } = parsed.data
  const couponCode = parsed.data.couponCode ? normalizeCouponCode(parsed.data.couponCode) : undefined
  const payload = await getPayloadClient()
  const [catalog, coupon, delivery] = await Promise.all([
    loadCatalogForCart(payload, items.map((i) => i.productId), locale),
    loadCoupon(payload, couponCode),
    loadDeliveryConfig(payload, locale),
  ])
  const method = delivery.methods.find((m) => m.code === deliveryMethod) ?? null
  const zone = district ? resolveZone(delivery.zones, district) : null
  const totals = priceCart({ items, catalog, coupon, couponCode, zones: district ? delivery.zones : [], district, method })
  return {
    totals,
    zoneEstimate: zone && 'estimate' in zone ? (zone as { estimate?: string }).estimate : undefined,
    deliveryAvailable: !district || Boolean(zone),
  }
}

export type AddCheck = { ok: true; available: number } | { ok: false; reason: 'unavailable' | 'out_of_stock' | 'insufficient_stock' | 'rate_limited'; available: number }

/** Check a variant can be added (published, exists, enough stock for the resulting cart quantity). */
export async function checkAddToCartAction(input: { productId: number; variantId: string; quantity: number; locale: 'bn' | 'en' }): Promise<AddCheck> {
  if (!rateLimit(`add:${await ip()}`, 60, 60_000).ok) return { ok: false, reason: 'rate_limited', available: 0 }
  const parsed = cartLineSchema.extend({ locale: localeSchema }).safeParse(input)
  if (!parsed.success) return { ok: false, reason: 'unavailable', available: 0 }
  const payload = await getPayloadClient()
  const catalog = await loadCatalogForCart(payload, [parsed.data.productId], parsed.data.locale)
  const product = catalog.get(String(parsed.data.productId))
  const variant = product?.variants.find((v) => v.id === parsed.data.variantId)
  if (!product?.published || !variant) return { ok: false, reason: 'unavailable', available: 0 }
  const available = Math.max(0, variant.stock)
  if (available === 0) return { ok: false, reason: 'out_of_stock', available }
  if (parsed.data.quantity > available) return { ok: false, reason: 'insufficient_stock', available }
  return { ok: true, available }
}

export type PlaceOrderActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: PlaceOrderError | 'rate_limited'; fieldErrors?: Record<string, string>; totals?: CartTotals }

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderActionResult> {
  const clientIp = await ip()
  if (!rateLimit(`order:${clientIp}`, 8, 10 * 60_000).ok) return { ok: false, error: 'rate_limited' }
  const payload = await getPayloadClient()
  const result = await createOrder(payload, input)
  if (!result.ok) return result

  const locale = input.locale
  const orderPath = orderUrlPath(locale, result.orderNumber)
  if (!result.duplicate) {
    after(async () => {
      const order = (await payload.findByID({ collection: 'orders', id: result.orderId, depth: 0, overrideAccess: true })) as Order
      await sendOrderNotifications(payload, order)
    })
  }
  if (result.paymentMethod === 'cod') return { ok: true, redirectTo: orderPath }

  const order = (await payload.findByID({ collection: 'orders', id: result.orderId, depth: 0, overrideAccess: true })) as Order
  if (order.paymentStatus === 'paid') return { ok: true, redirectTo: orderPath }
  const payment = await initiatePayment(payload, order, result.paymentMethod as GatewayId, clientIp)
  // If the gateway is unreachable the order is still saved; the order page offers "try payment again".
  return { ok: true, redirectTo: payment.ok ? payment.redirectUrl : `${orderPath}&payment=failed` }
}

export async function retryPaymentAction(input: { orderNumber: string; token: string }): Promise<{ redirectTo: string } | { error: string }> {
  const clientIp = await ip()
  if (!rateLimit(`retry:${clientIp}`, 6, 10 * 60_000).ok) return { error: 'rate_limited' }
  if (!verifyOrderAccessToken(input.orderNumber, input.token)) return { error: 'forbidden' }
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'orders', where: { orderNumber: { equals: input.orderNumber } }, limit: 1, depth: 0, overrideAccess: true })
  const order = res.docs[0] as Order | undefined
  if (!order || order.paymentMethod === 'cod') return { error: 'not_payable' }
  const result = await initiatePayment(payload, order, order.paymentMethod as GatewayId, clientIp)
  return result.ok ? { redirectTo: result.redirectUrl } : { error: result.reason }
}

export type TrackState = { status: 'idle' } | { status: 'not_found' } | { status: 'rate_limited' } | { status: 'found'; redirectTo: string }

/** Order tracking: order number + checkout phone number. Rate limited against enumeration. */
export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  if (!rateLimit(`track:${await ip()}`, 10, 10 * 60_000).ok) return { status: 'rate_limited' }
  const orderNumber = String(formData.get('orderNumber') ?? '').trim().toUpperCase()
  const phone = String(formData.get('phone') ?? '')
  const locale = formData.get('locale') === 'en' ? 'en' : 'bn'
  const payload = await getPayloadClient()
  const order = await getOrderWithPhone(payload, orderNumber, phone)
  if (!order) return { status: 'not_found' }
  return { status: 'found', redirectTo: orderUrlPath(locale, order.orderNumber) }
}

import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload, type PayloadRequest } from 'payload'
import { priceCart, type CartTotals } from '../../lib/cart-math'
import { normalizeCouponCode } from '../../lib/coupons'
import { divisionName, districtName } from '../../lib/bd-locations'
import { resolveZone } from '../../lib/delivery'
import { placeOrderSchema, type PlaceOrderInput } from '../../lib/validation/checkout'
import { normalizeBdPhone } from '../../lib/validation/phone'
import { loadCatalogForCart, loadCoupon, loadDeliveryConfig } from '../catalog-pricing'
import { refreshProductStockAggregates, tryConsumeCoupon, tryDecrementStock } from '../inventory-sql'
import { getEnabledPaymentMethods } from '../payments/registry'
import { generateOrderNumber, orderAccessToken } from './tokens'
import type { Order } from '../../payload-types'

export type PlaceOrderError =
  | 'invalid_input'
  | 'cart_issues'
  | 'stock_changed'
  | 'delivery_unavailable'
  | 'payment_unavailable'
  | 'server_error'

export type PlaceOrderResult =
  | { ok: true; orderId: number; orderNumber: string; accessToken: string; paymentMethod: Order['paymentMethod']; total: number; duplicate?: boolean }
  | { ok: false; error: PlaceOrderError; fieldErrors?: Record<string, string>; totals?: CartTotals }

class StockError extends Error {}

/**
 * Create an order from untrusted input:
 *  1. validate the form and cart shape,
 *  2. price everything from the database (browser prices are never used),
 *  3. in ONE database transaction: decrement stock atomically, consume the coupon, create the order,
 *     write stock-ledger rows and upsert the customer record.
 * The same idempotency key always returns the same order, so double submits never create two orders.
 */
export async function createOrder(payload: Payload, rawInput: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(rawInput)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'form' && issue.path[1]) fieldErrors[String(issue.path[1])] = issue.message
    }
    return { ok: false, error: 'invalid_input', fieldErrors }
  }
  const input = parsed.data
  const { form, locale } = input

  // Idempotency: a repeated submit returns the original order.
  const existing = await findByIdempotencyKey(payload, input.idempotencyKey)
  if (existing) return successFrom(existing, true)

  const phone = normalizeBdPhone(form.phone)!
  const couponCode = input.couponCode ? normalizeCouponCode(input.couponCode) : undefined

  const [catalog, coupon, delivery, paymentMethods] = await Promise.all([
    loadCatalogForCart(payload, input.items.map((i) => i.productId), locale),
    loadCoupon(payload, couponCode),
    loadDeliveryConfig(payload, locale),
    getEnabledPaymentMethods(payload),
  ])

  const method = delivery.methods.find((m) => m.code === form.deliveryMethod) ?? null
  const zone = resolveZone(delivery.zones, form.district)
  if (!method) return { ok: false, error: 'invalid_input', fieldErrors: { deliveryMethod: 'deliveryMethod' } }
  if (!zone) return { ok: false, error: 'delivery_unavailable', fieldErrors: { district: 'district' } }

  const totals = priceCart({
    items: input.items,
    catalog,
    coupon,
    couponCode,
    zones: delivery.zones,
    district: form.district,
    method,
  })
  if (!totals.purchasable || totals.couponError) return { ok: false, error: 'cart_issues', totals }

  const pm = paymentMethods.find((m) => m.id === form.paymentMethod)
  if (!pm || (pm.maxTotal != null && totals.total > pm.maxTotal)) {
    return { ok: false, error: 'payment_unavailable', fieldErrors: { paymentMethod: 'paymentMethod' } }
  }

  const req = await createLocalReq({ locale }, payload)
  await initTransaction(req)
  try {
    for (const line of totals.lines) {
      const left = await tryDecrementStock(payload, { productId: line.productId, variantId: line.variantId, quantity: line.quantity }, req)
      if (left === null) throw new StockError(line.sku)
    }
    if (coupon && totals.discount > 0) {
      const consumed = await tryConsumeCoupon(payload, coupon.id, req)
      if (!consumed) throw new StockError('coupon')
    }

    const customerId = await upsertCustomer(payload, req, {
      name: form.name,
      phone,
      email: form.email || undefined,
      division: form.division,
      district: form.district,
      area: form.area,
      address: form.address,
      total: totals.total,
    })

    const orderNumber = await uniqueOrderNumber(payload, req)
    const order = (await payload.create({
      collection: 'orders',
      req,
      overrideAccess: true,
      data: {
        orderNumber,
        idempotencyKey: input.idempotencyKey,
        locale,
        status: 'pending',
        paymentStatus: form.paymentMethod === 'cod' ? 'unpaid' : 'pending',
        paymentMethod: form.paymentMethod,
        customer: customerId,
        customerName: form.name,
        customerPhone: phone,
        customerEmail: form.email || undefined,
        division: divisionName(form.division, 'en'),
        district: form.district as Order['district'],
        area: form.area,
        address: form.address,
        customerNotes: form.notes || undefined,
        deliveryMethod: method.code,
        deliveryZone: zone.code,
        couponCode: totals.couponCode,
        items: totals.lines.map((l) => {
          const snap = catalog.get(String(l.productId))!
          const vn = snap.variantNames[l.variantId]
          return {
            product: Number(l.productId),
            productName: locale === 'bn' ? snap.nameBn : snap.nameEn,
            productNameEn: snap.nameEn,
            variantId: l.variantId,
            variantLabel: locale === 'bn' ? vn?.bn : vn?.en,
            sku: l.sku,
            unitPrice: l.unitPrice,
            regularPrice: l.regularPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          }
        }),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: totals.shipping,
        total: totals.total,
        statusHistory: [
          {
            status: 'pending',
            paymentStatus: form.paymentMethod === 'cod' ? 'unpaid' : 'pending',
            at: new Date().toISOString(),
            by: 'customer',
            note: `Placed online (${districtName(form.district, 'en')})`,
          },
        ],
      },
    })) as Order

    for (const l of totals.lines) {
      await payload.create({
        collection: 'stock-adjustments',
        req,
        overrideAccess: true,
        data: {
          sku: l.sku,
          delta: -l.quantity,
          reason: 'order',
          product: Number(l.productId),
          variantId: l.variantId,
          order: order.id,
          createdBy: 'checkout',
          systemGenerated: true,
          note: order.orderNumber,
        },
      })
    }
    for (const productId of new Set(totals.lines.map((l) => l.productId))) {
      await refreshProductStockAggregates(payload, productId, req)
    }

    await commitTransaction(req)
    return successFrom(order, false)
  } catch (err) {
    await killTransaction(req)
    if (err instanceof StockError) {
      const fresh = priceCart({
        items: input.items,
        catalog: await loadCatalogForCart(payload, input.items.map((i) => i.productId), locale),
        coupon: await loadCoupon(payload, couponCode),
        couponCode,
        zones: delivery.zones,
        district: form.district,
        method,
      })
      return { ok: false, error: 'stock_changed', totals: fresh }
    }
    // A concurrent submit with the same idempotency key may have won the race.
    const raced = await findByIdempotencyKey(payload, input.idempotencyKey)
    if (raced) return successFrom(raced, true)
    payload.logger.error({ err, msg: 'createOrder failed' })
    return { ok: false, error: 'server_error' }
  }
}

function successFrom(order: Order, duplicate: boolean): PlaceOrderResult {
  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    accessToken: orderAccessToken(order.orderNumber),
    paymentMethod: order.paymentMethod,
    total: order.total,
    duplicate,
  }
}

async function findByIdempotencyKey(payload: Payload, key: string): Promise<Order | null> {
  const res = await payload.find({
    collection: 'orders',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (res.docs[0] as Order | undefined) ?? null
}

async function uniqueOrderNumber(payload: Payload, req: PayloadRequest): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = generateOrderNumber()
    const clash = await payload.count({ collection: 'orders', where: { orderNumber: { equals: candidate } }, overrideAccess: true, req })
    if (clash.totalDocs === 0) return candidate
  }
  throw new Error('Could not allocate a unique order number')
}

async function upsertCustomer(
  payload: Payload,
  req: PayloadRequest,
  c: { name: string; phone: string; email?: string; division: string; district: string; area: string; address: string; total: number },
): Promise<number> {
  const found = await payload.find({ collection: 'customers', where: { phone: { equals: c.phone } }, limit: 1, depth: 0, overrideAccess: true, req })
  const lastAddress = { division: c.division, district: c.district as never, area: c.area, address: c.address }
  const existing = found.docs[0]
  if (existing) {
    await payload.update({
      collection: 'customers',
      id: existing.id,
      req,
      overrideAccess: true,
      data: {
        name: c.name,
        email: c.email || existing.email,
        lastAddress,
        orderCount: (existing.orderCount ?? 0) + 1,
        totalSpent: (existing.totalSpent ?? 0) + c.total,
        lastOrderAt: new Date().toISOString(),
      },
    })
    return existing.id
  }
  const created = await payload.create({
    collection: 'customers',
    req,
    overrideAccess: true,
    data: { name: c.name, phone: c.phone, email: c.email, lastAddress, orderCount: 1, totalSpent: c.total, lastOrderAt: new Date().toISOString() },
  })
  return created.id
}

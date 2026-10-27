import type { Payload } from 'payload'
import { normalizeBdPhone } from '../../lib/validation/phone'
import type { Order } from '../../payload-types'
import { verifyOrderAccessToken } from './tokens'

/** Customer-safe view of an order (no internal notes, no idempotency keys). */
export interface PublicOrder {
  id: number
  orderNumber: string
  createdAt: string
  status: Order['status']
  paymentStatus: Order['paymentStatus']
  paymentMethod: Order['paymentMethod']
  customerName: string
  customerPhoneMasked: string
  district?: string | null
  area?: string | null
  address: string
  items: { productName: string; variantLabel?: string | null; quantity: number; unitPrice: number; lineTotal: number }[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  history: { status: string; at: string }[]
  locale: 'bn' | 'en'
}

export function maskPhone(phone: string): string {
  return phone.length >= 11 ? `${phone.slice(0, 3)}••••${phone.slice(-4)}` : '••••'
}

function toPublic(o: Order): PublicOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    customerName: o.customerName,
    customerPhoneMasked: maskPhone(o.customerPhone),
    district: o.district,
    area: o.area,
    address: o.address,
    items: (o.items ?? []).map((i) => ({
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: o.subtotal,
    discount: o.discount ?? 0,
    shippingFee: o.shippingFee ?? 0,
    total: o.total,
    history: (o.statusHistory ?? []).map((h) => ({ status: h.status ?? '', at: h.at ?? o.createdAt })),
    locale: (o.locale as 'bn' | 'en') ?? 'bn',
  }
}

async function byNumber(payload: Payload, orderNumber: string): Promise<Order | null> {
  const res = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: orderNumber.trim().toUpperCase() } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (res.docs[0] as Order | undefined) ?? null
}

/** Access via the private link token. */
export async function getOrderWithToken(payload: Payload, orderNumber: string, token: string | undefined): Promise<PublicOrder | null> {
  if (!verifyOrderAccessToken(orderNumber, token)) return null
  const order = await byNumber(payload, orderNumber)
  return order ? toPublic(order) : null
}

/** Access via order number + the phone number used at checkout (tracking form). */
export async function getOrderWithPhone(payload: Payload, orderNumber: string, phone: string): Promise<PublicOrder | null> {
  const normalized = normalizeBdPhone(phone)
  if (!normalized || !/^[A-Z0-9-]{6,30}$/i.test(orderNumber.trim())) return null
  const order = await byNumber(payload, orderNumber)
  if (!order || order.customerPhone !== normalized) return null
  return toPublic(order)
}

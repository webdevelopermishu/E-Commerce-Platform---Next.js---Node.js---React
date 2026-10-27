import type { Payload, Where } from 'payload'
import { env } from '../env'
import { orderUrlPath } from '../orders/tokens'
import type { Order, Payment } from '../../payload-types'
import { gateways } from './registry'
import { GatewayError, type GatewayId, type VerifyResult } from './types'

/** Unique per attempt, alphanumeric, ≤ 20 chars (Nagad's orderId limit). */
function paymentReference(orderNumber: string, attempt: number): string {
  return `${orderNumber.replace(/[^A-Z0-9]/gi, '')}P${attempt}`.slice(0, 20)
}

export async function initiatePayment(
  payload: Payload,
  order: Order,
  provider: GatewayId,
  clientIp?: string,
): Promise<{ ok: true; redirectUrl: string } | { ok: false; reason: string }> {
  const gateway = gateways[provider]
  if (!gateway?.isConfigured()) return { ok: false, reason: 'gateway_not_configured' }
  if (order.paymentStatus === 'paid' || order.status === 'cancelled') return { ok: false, reason: 'order_not_payable' }

  const attempts = await payload.count({ collection: 'payments', where: { order: { equals: order.id } }, overrideAccess: true })
  if (attempts.totalDocs >= 8) return { ok: false, reason: 'too_many_attempts' }
  const reference = paymentReference(order.orderNumber, attempts.totalDocs + 1)

  const payment = (await payload.create({
    collection: 'payments',
    overrideAccess: true,
    data: { order: order.id, reference, provider, amount: order.total, currency: 'BDT', status: 'initiated' },
  })) as Payment

  try {
    const result = await gateway.initiate({
      reference,
      orderNumber: order.orderNumber,
      amount: order.total,
      customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail, address: order.address, district: order.district },
      productSummary: (order.items ?? []).map((i) => `${i.productNameEn || i.productName} x${i.quantity}`).join(', '),
      callbackUrl: `${env.NEXT_PUBLIC_SERVER_URL}/payments/${provider}/callback`,
      ipnUrl: provider === 'sslcommerz' ? `${env.NEXT_PUBLIC_SERVER_URL}/payments/sslcommerz/ipn` : undefined,
      clientIp,
    })
    await payload.update({
      collection: 'payments',
      id: payment.id,
      overrideAccess: true,
      data: { gatewayPaymentId: result.gatewayPaymentId },
    })
    if (order.paymentStatus !== 'pending') {
      await payload.update({ collection: 'orders', id: order.id, overrideAccess: true, data: { paymentStatus: 'pending' } })
    }
    return { ok: true, redirectUrl: result.redirectUrl }
  } catch (err) {
    const reason = err instanceof GatewayError ? err.message : 'Gateway error'
    payload.logger.error({ err, msg: `Payment initiation failed for ${order.orderNumber}` })
    await payload.update({ collection: 'payments', id: payment.id, overrideAccess: true, data: { status: 'failed', failureReason: reason } })
    return { ok: false, reason: 'gateway_error' }
  }
}

export async function findPayment(payload: Payload, by: { reference?: string; gatewayPaymentId?: string }): Promise<Payment | null> {
  if (!by.reference && !by.gatewayPaymentId) return null
  const where: Where = by.reference ? { reference: { equals: by.reference } } : { gatewayPaymentId: { equals: by.gatewayPaymentId } }
  const res = await payload.find({ collection: 'payments', where, limit: 1, depth: 0, overrideAccess: true })
  return (res.docs[0] as Payment | undefined) ?? null
}

/**
 * Apply a server-verified gateway result. Idempotent: a payment that already succeeded is never changed,
 * and an order is marked paid only when the verified amount and reference match exactly.
 * Returns the URL to send the customer to.
 */
export async function applyVerification(payload: Payload, payment: Payment, result: VerifyResult): Promise<string> {
  const orderId = typeof payment.order === 'object' ? payment.order.id : payment.order
  const order = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true })) as Order
  const target = `${env.NEXT_PUBLIC_SERVER_URL}${orderUrlPath(order.locale || 'bn', order.orderNumber)}`

  if (payment.status === 'succeeded') return `${target}&payment=success`

  let status = result.status
  let reason = result.reason
  if (status === 'succeeded') {
    if (result.reference && result.reference !== payment.reference) {
      status = 'failed'
      reason = 'Gateway reference does not match this payment'
    } else if (result.amount !== payment.amount || payment.amount !== order.total) {
      status = 'failed'
      reason = `Amount mismatch (gateway ${result.amount ?? '?'} vs expected ${payment.amount})`
    }
  }

  if (status === 'pending') return `${target}&payment=pending`

  await payload.update({
    collection: 'payments',
    id: payment.id,
    overrideAccess: true,
    data: {
      status: status === 'succeeded' ? 'succeeded' : status === 'cancelled' ? 'cancelled' : 'failed',
      transactionId: result.transactionId,
      verifiedAt: new Date().toISOString(),
      failureReason: status === 'succeeded' ? undefined : reason,
      gatewayResponse: (result.raw ?? null) as never,
    },
  })

  if (status === 'succeeded') {
    if (order.paymentStatus !== 'paid') {
      await payload.update({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
        data: {
          paymentStatus: 'paid',
          statusNote: [`Paid via ${payment.provider} (${result.transactionId ?? 'no trx id'})`, result.riskNote].filter(Boolean).join(' — '),
        },
      })
    }
    return `${target}&payment=success`
  }
  if (order.paymentStatus !== 'paid') {
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: { paymentStatus: status === 'cancelled' ? 'cancelled' : 'failed', statusNote: `Payment ${status}: ${reason ?? ''}`.trim() },
    })
  }
  return `${target}&payment=failed`
}

import crypto from 'crypto'
import { env } from '../env'

/**
 * The private order link is /{lang}/order/{orderNumber}?t={token}, where token is an HMAC of the order
 * number keyed by the server secret. Knowing or guessing an order number is not enough to see the order.
 */
export function orderAccessToken(orderNumber: string): string {
  return crypto.createHmac('sha256', env.PAYLOAD_SECRET).update(`order-access:${orderNumber}`).digest('base64url').slice(0, 32)
}

export function verifyOrderAccessToken(orderNumber: string, token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false
  const expected = Buffer.from(orderAccessToken(orderNumber))
  const given = Buffer.from(token)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}

export function orderUrlPath(locale: string, orderNumber: string): string {
  return `/${locale}/order/${encodeURIComponent(orderNumber)}?t=${orderAccessToken(orderNumber)}`
}

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // no 0/O/1/I to avoid misreading on the phone

/** e.g. "AK-261026-7KQ4M" — date in Asia/Dhaka plus 5 random characters. */
export function generateOrderNumber(prefix = process.env.ORDER_PREFIX || 'AK', now = new Date()): string {
  const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000)
  const ymd = dhaka.toISOString().slice(2, 10).replace(/-/g, '')
  const bytes = crypto.randomBytes(5)
  const rand = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  return `${prefix}-${ymd}-${rand}`
}

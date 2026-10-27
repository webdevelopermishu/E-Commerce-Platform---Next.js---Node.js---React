import type { Payload } from 'payload'
import { formatPrice } from '../lib/i18n/format'
import type { Order } from '../payload-types'
import { env } from './env'
import { orderUrlPath } from './orders/tokens'

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Sends the customer confirmation (if they gave an email) and a staff notification (ORDER_NOTIFICATION_EMAIL).
 * No-op when SMTP is not configured. Failures are logged and never block the order.
 */
export async function sendOrderNotifications(payload: Payload, order: Order): Promise<void> {
  if (!env.SMTP_HOST) return
  const locale = (order.locale as 'bn' | 'en') || 'bn'
  const link = `${env.NEXT_PUBLIC_SERVER_URL}${orderUrlPath(locale, order.orderNumber)}`
  const rows = (order.items ?? [])
    .map((i) => `<tr><td>${esc(i.productName)}${i.variantLabel ? ` — ${esc(i.variantLabel)}` : ''}</td><td>× ${i.quantity}</td><td style="text-align:right">${formatPrice(i.lineTotal, locale)}</td></tr>`)
    .join('')
  const table = `<table cellpadding="6" style="border-collapse:collapse;width:100%;max-width:560px">${rows}
    <tr><td colspan="2"><strong>${locale === 'bn' ? 'সর্বমোট' : 'Total'}</strong></td><td style="text-align:right"><strong>${formatPrice(order.total, locale)}</strong></td></tr></table>`

  const tasks: Promise<unknown>[] = []
  if (order.customerEmail) {
    const subject = locale === 'bn' ? `অর্ডার ${order.orderNumber} গ্রহণ করা হয়েছে` : `Order ${order.orderNumber} received`
    const intro =
      locale === 'bn'
        ? `প্রিয় ${esc(order.customerName)}, আপনার অর্ডারটি আমরা পেয়েছি। পাঠানোর আগে আমরা ফোনে নিশ্চিত করব।`
        : `Dear ${esc(order.customerName)}, we have received your order and will call to confirm before dispatch.`
    tasks.push(
      payload.sendEmail({
        to: order.customerEmail,
        subject,
        html: `<p>${intro}</p>${table}<p><a href="${link}">${locale === 'bn' ? 'অর্ডার দেখুন' : 'View your order'}</a></p>`,
      }),
    )
  }
  if (env.ORDER_NOTIFICATION_EMAIL) {
    tasks.push(
      payload.sendEmail({
        to: env.ORDER_NOTIFICATION_EMAIL,
        subject: `New order ${order.orderNumber} — ${formatPrice(order.total, 'en')} (${order.paymentMethod})`,
        html: `<p>${esc(order.customerName)} · ${esc(order.customerPhone)} · ${esc(order.district ?? '')}</p>${table}
          <p><a href="${env.NEXT_PUBLIC_SERVER_URL}/admin/collections/orders/${order.id}">Open in admin</a></p>`,
      }),
    )
  }
  const results = await Promise.allSettled(tasks)
  for (const r of results) if (r.status === 'rejected') payload.logger.error({ err: r.reason, msg: 'Order email failed' })
}

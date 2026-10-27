import type { Endpoint } from 'payload'
import { hasRole } from '../../access'
import { districtName } from '../../lib/bd-locations'
import { formatPrice } from '../../lib/i18n/format'
import type { Order } from '../../payload-types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** GET /api/orders/:id/invoice — printable HTML invoice (staff only). Uses Ctrl/Cmd+P to save as PDF. */
export const invoiceEndpoint: Endpoint = {
  path: '/:id/invoice',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'manager')) return new Response('Forbidden', { status: 403 })
    const id = Number(req.routeParams?.id)
    if (!Number.isInteger(id)) return new Response('Not found', { status: 404 })
    let order: Order
    try {
      order = (await req.payload.findByID({ collection: 'orders', id, depth: 0, req, overrideAccess: false })) as Order
    } catch {
      return new Response('Not found', { status: 404 })
    }
    const branding = await req.payload.findGlobal({ slug: 'branding', locale: 'en', depth: 1, req })
    const p = (v: number | null | undefined) => formatPrice(v ?? 0, 'en')
    const logo = typeof branding.logo === 'object' && branding.logo?.url ? `<img src="${esc(branding.logo.url)}" alt="" style="height:48px">` : ''
    const rows = (order.items ?? [])
      .map(
        (i) => `<tr><td>${esc(i.productName)}${i.productNameEn && i.productNameEn !== i.productName ? `<br><small>${esc(i.productNameEn)}</small>` : ''}</td>
        <td>${esc(i.variantLabel)}</td><td>${esc(i.sku)}</td><td class="n">${i.quantity}</td><td class="n">${p(i.unitPrice)}</td><td class="n">${p(i.lineTotal)}</td></tr>`,
      )
      .join('')
    const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>Invoice ${esc(order.orderNumber)}</title>
<style>
body{font-family:"Hind Siliguri","Noto Sans Bengali",system-ui,sans-serif;color:#243126;max-width:820px;margin:32px auto;padding:0 24px}
h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px;border-bottom:1px solid #e4dccb;text-align:left;vertical-align:top}
th{background:#f6f0e2;font-weight:600}.n{text-align:right;white-space:nowrap}.grid{display:flex;justify-content:space-between;gap:24px;margin-top:24px}
.tot td{border:none}.tot tr:last-child td{font-weight:700;font-size:18px;border-top:2px solid #243126}small{color:#5b6b5e}
@media print{.noprint{display:none}body{margin:0}}
</style></head><body>
<p class="noprint"><button onclick="window.print()">Print / Save as PDF</button></p>
<div class="grid"><div>${logo}<h1>${esc(branding.brandName)}</h1><small>${esc(branding.address ?? '')}<br>${esc(branding.phone ?? '')} ${esc(branding.email ?? '')}</small></div>
<div style="text-align:right"><h1>Invoice</h1><div>${esc(order.orderNumber)}</div><small>${new Date(order.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}</small></div></div>
<div class="grid"><div><strong>Deliver to</strong><br>${esc(order.customerName)}<br>${esc(order.customerPhone)}<br>${esc(order.address)}<br>${esc(order.area)}, ${esc(order.district ? districtName(order.district, 'en') : '')}</div>
<div style="text-align:right"><strong>Payment</strong><br>${esc(order.paymentMethod)} — ${esc(order.paymentStatus)}<br><strong>Status</strong><br>${esc(order.status)}</div></div>
<table><thead><tr><th>Product</th><th>Size</th><th>SKU</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">Total</th></tr></thead><tbody>${rows}</tbody></table>
<table class="tot" style="max-width:320px;margin-left:auto"><tr><td>Subtotal</td><td class="n">${p(order.subtotal)}</td></tr>
${order.discount ? `<tr><td>Discount ${esc(order.couponCode ?? '')}</td><td class="n">−${p(order.discount)}</td></tr>` : ''}
<tr><td>Delivery</td><td class="n">${p(order.shippingFee)}</td></tr><tr><td>Total</td><td class="n">${p(order.total)}</td></tr></table>
${order.customerNotes ? `<p><strong>Customer note:</strong> ${esc(order.customerNotes)}</p>` : ''}
</body></html>`
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
  },
}

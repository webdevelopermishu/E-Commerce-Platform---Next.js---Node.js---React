import type { Endpoint, Where } from 'payload'
import { hasRole } from '../../access'
import type { Order } from '../../payload-types'
import { poishaToTaka, toCsv } from './csv'

/** GET /api/orders/export.csv?from=YYYY-MM-DD&to=YYYY-MM-DD&status=… (managers and admins only) */
export const ordersCsvEndpoint: Endpoint = {
  path: '/export.csv',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'manager')) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const q = req.searchParams
    const and: Where[] = []
    const from = q.get('from')
    const to = q.get('to')
    const status = q.get('status')
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) and.push({ createdAt: { greater_than_equal: `${from}T00:00:00+06:00` } })
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) and.push({ createdAt: { less_than_equal: `${to}T23:59:59+06:00` } })
    if (status) and.push({ status: { equals: status } })

    const res = await req.payload.find({
      collection: 'orders',
      where: and.length ? { and } : undefined,
      sort: '-createdAt',
      limit: 5000,
      depth: 0,
      pagination: false,
      req,
      overrideAccess: false,
    })
    const header = [
      'Order number', 'Created (Dhaka)', 'Status', 'Payment status', 'Payment method', 'Customer', 'Phone', 'Email',
      'District', 'Area', 'Address', 'Items', 'Subtotal (BDT)', 'Discount (BDT)', 'Delivery (BDT)', 'Total (BDT)', 'Coupon',
    ]
    const rows = (res.docs as Order[]).map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' }),
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      o.customerName,
      o.customerPhone,
      o.customerEmail ?? '',
      o.district ?? '',
      o.area ?? '',
      o.address,
      (o.items ?? []).map((i) => `${i.sku ?? ''} ${i.productNameEn || i.productName} (${i.variantLabel ?? ''}) x${i.quantity}`).join('; '),
      poishaToTaka(o.subtotal),
      poishaToTaka(o.discount),
      poishaToTaka(o.shippingFee),
      poishaToTaka(o.total),
      o.couponCode ?? '',
    ])
    return new Response(toCsv(header, rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}

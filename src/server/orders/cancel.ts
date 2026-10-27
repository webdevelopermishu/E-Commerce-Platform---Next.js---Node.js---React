import type { PayloadRequest } from 'payload'
import { applyStockDelta, refreshProductStockAggregates } from '../inventory-sql'
import type { Order } from '../../payload-types'

/**
 * Put an order's units back into stock (called once, when an order is cancelled).
 * Runs inside the order update's transaction and writes ledger rows.
 */
export async function restoreOrderStock(req: PayloadRequest, order: Order): Promise<void> {
  const productIds = new Set<number>()
  for (const item of order.items ?? []) {
    const productId = typeof item.product === 'object' && item.product ? item.product.id : item.product
    if (!productId || !item.variantId) continue
    const result = await applyStockDelta(req.payload, { productId, variantId: item.variantId, delta: item.quantity }, req)
    if (!result) continue // variant was deleted since; nothing to restore into
    productIds.add(Number(productId))
    await req.payload.create({
      collection: 'stock-adjustments',
      req,
      overrideAccess: true,
      data: {
        sku: item.sku ?? '',
        delta: item.quantity,
        reason: 'order_cancel',
        product: Number(productId),
        variantId: item.variantId,
        order: order.id,
        stockBefore: result.before,
        stockAfter: result.after,
        createdBy: (req.user as { email?: string } | null)?.email ?? 'system',
        systemGenerated: true,
        note: `Cancelled ${order.orderNumber}`,
      },
    })
  }
  for (const id of productIds) await refreshProductStockAggregates(req.payload, id, req)
}

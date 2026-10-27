import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

/**
 * Inventory writes use parameterized SQL so that a stock decrement is a single atomic
 * `UPDATE ... WHERE stock >= qty` — two simultaneous checkouts can never both take the last unit.
 * When `req` carries a Payload transaction, the SQL joins that same transaction.
 */

type Executor = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }> }

export async function getExecutor(payload: Payload, req?: Partial<PayloadRequest>): Promise<Executor> {
  const adapter = payload.db as unknown as { drizzle: Executor; sessions?: Record<string, { db: Executor }> }
  if (req?.transactionID) {
    const id = await req.transactionID
    const session = adapter.sessions?.[String(id)]
    if (session?.db) return session.db
  }
  return adapter.drizzle
}

/** Recompute products.total_stock from its variants. */
export async function refreshProductStockAggregates(payload: Payload, productId: number | string, req?: Partial<PayloadRequest>): Promise<void> {
  const db = await getExecutor(payload, req)
  await db.execute(sql`
    UPDATE products
       SET total_stock = COALESCE((SELECT SUM(GREATEST(stock, 0)) FROM products_variants WHERE _parent_id = ${Number(productId)}), 0)
     WHERE id = ${Number(productId)}
  `)
}

/**
 * Atomically take `quantity` units. Returns the remaining stock, or null if there was not enough
 * (in which case nothing was changed).
 */
export async function tryDecrementStock(
  payload: Payload,
  params: { productId: number | string; variantId: string; quantity: number },
  req?: Partial<PayloadRequest>,
): Promise<number | null> {
  const db = await getExecutor(payload, req)
  const res = await db.execute(sql`
    UPDATE products_variants
       SET stock = stock - ${params.quantity}
     WHERE id = ${params.variantId}
       AND _parent_id = ${Number(params.productId)}
       AND stock >= ${params.quantity}
    RETURNING stock
  `)
  if (!res.rows.length) return null
  return Number(res.rows[0]!.stock)
}

/** Add (positive) or remove (negative) stock, never going below zero. Returns the new stock or null if the variant is missing. */
export async function applyStockDelta(
  payload: Payload,
  params: { productId: number | string; variantId: string; delta: number },
  req?: Partial<PayloadRequest>,
): Promise<{ before: number; after: number } | null> {
  const db = await getExecutor(payload, req)
  const res = await db.execute(sql`
    WITH prev AS (
      SELECT stock FROM products_variants
       WHERE id = ${params.variantId} AND _parent_id = ${Number(params.productId)}
       FOR UPDATE
    )
    UPDATE products_variants v
       SET stock = GREATEST(0, v.stock + ${params.delta})
      FROM prev
     WHERE v.id = ${params.variantId} AND v._parent_id = ${Number(params.productId)}
    RETURNING prev.stock AS before, v.stock AS after
  `)
  if (!res.rows.length) return null
  return { before: Number(res.rows[0]!.before), after: Number(res.rows[0]!.after) }
}

/** Atomically consume one coupon use if the limit allows it. */
export async function tryConsumeCoupon(payload: Payload, couponId: number | string, req?: Partial<PayloadRequest>): Promise<boolean> {
  const db = await getExecutor(payload, req)
  const res = await db.execute(sql`
    UPDATE coupons
       SET used_count = COALESCE(used_count, 0) + 1
     WHERE id = ${Number(couponId)}
       AND (usage_limit IS NULL OR usage_limit = 0 OR COALESCE(used_count, 0) < usage_limit)
    RETURNING used_count
  `)
  return res.rows.length > 0
}

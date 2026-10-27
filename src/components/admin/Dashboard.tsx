import { sql } from '@payloadcms/db-postgres'
import Link from 'next/link'
import type { ServerProps } from 'payload'
import { hasRole } from '@/access'
import { getExecutor } from '@/server/inventory-sql'

const RANGES = [7, 30, 90, 365] as const
const fmt = (poisha: number) => `৳${Math.round(poisha / 100).toLocaleString('en-BD')}`

/** The last `n` calendar days (Asia/Dhaka, UTC+6), oldest first, as YYYY-MM-DD. */
function dhakaDays(n: number): string[] {
  const now = Date.now() + 6 * 3600_000
  return Array.from({ length: n }, (_, k) => new Date(now - (n - 1 - k) * 86400_000).toISOString().slice(0, 10))
}

const card: React.CSSProperties = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  padding: '14px 16px',
  background: 'var(--theme-elevation-0)',
}

/**
 * Admin dashboard: every number is a live database query. "Booked revenue" counts all non-cancelled orders;
 * "Collected" counts orders whose payment is confirmed (online payments verified, COD marked paid).
 */
export async function Dashboard({ payload, user, searchParams }: ServerProps) {
  if (!hasRole(user as never, 'admin', 'manager')) {
    return (
      <div style={{ ...card, marginBottom: 24 }}>
        Welcome. Use the menu to manage products, categories and content.
      </div>
    )
  }
  const raw = Number(searchParams?.range)
  const days = (RANGES as readonly number[]).includes(raw) ? raw : 30
  const db = await getExecutor(payload)
  const since = sql`NOW() - (${days} || ' days')::interval`

  const [totals, daily, lowStock, recent, productCount] = await Promise.all([
    db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status::text <> 'cancelled')                         AS orders,
        COALESCE(SUM(total) FILTER (WHERE status::text <> 'cancelled'), 0)          AS booked,
        COALESCE(SUM(total) FILTER (WHERE payment_status::text = 'paid'), 0)        AS collected,
        COUNT(*) FILTER (WHERE status::text = 'pending')                            AS pending,
        COUNT(*) FILTER (WHERE status::text = 'delivered')                          AS delivered,
        COUNT(*) FILTER (WHERE status::text = 'cancelled')                          AS cancelled
      FROM orders WHERE created_at >= ${since}`),
    db.execute(sql`
      SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Asia/Dhaka'), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
        FROM orders
       WHERE created_at >= ${since} AND status::text <> 'cancelled'
       GROUP BY 1 ORDER BY 1`),
    db.execute(sql`
      SELECT p.id, pl.name, v.sku, v.stock, COALESCE(v.low_stock_threshold, 5) AS threshold
        FROM products_variants v
        JOIN products p ON p.id = v._parent_id
        LEFT JOIN products_locales pl ON pl._parent_id = p.id AND pl._locale = 'en'
       WHERE p.status::text = 'published' AND v.stock <= COALESCE(v.low_stock_threshold, 5)
       ORDER BY v.stock ASC LIMIT 10`),
    payload.find({ collection: 'orders', sort: '-createdAt', limit: 8, depth: 0, overrideAccess: true }),
    payload.count({ collection: 'products', overrideAccess: true }),
  ])

  const t = totals.rows[0] as Record<string, string | number>
  const n = (k: string) => Number(t?.[k] ?? 0)

  // Fill missing days with zero so the chart has an honest time axis.
  const byDay = new Map(daily.rows.map((r) => [String(r.day), Number(r.revenue)]))
  const points = dhakaDays(Math.min(days, 90)).map((day) => ({ day, revenue: byDay.get(day) ?? 0 }))
  const max = Math.max(1, ...points.map((p) => p.revenue))
  const W = 720
  const H = 160
  const bw = W / points.length

  const stats: [string, string][] = [
    ['Orders', n('orders').toLocaleString('en-BD')],
    ['Booked revenue', fmt(n('booked'))],
    ['Collected', fmt(n('collected'))],
    ['Pending', n('pending').toLocaleString('en-BD')],
    ['Delivered', n('delivered').toLocaleString('en-BD')],
    ['Products', productCount.totalDocs.toLocaleString('en-BD')],
  ]

  return (
    <section style={{ marginBottom: 32 }} aria-label="Store overview">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Store overview</h2>
        <nav aria-label="Date range" style={{ display: 'flex', gap: 8 }}>
          {RANGES.map((r) => (
            <Link
              key={r} href={`?range=${r}`}
              aria-current={r === days ? 'page' : undefined}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                textDecoration: 'none',
                border: '1px solid var(--theme-elevation-150)',
                background: r === days ? 'var(--theme-elevation-100)' : 'transparent',
                fontWeight: r === days ? 600 : 400,
              }}
            >
              {r === 365 ? '12 months' : `${r} days`}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {stats.map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 8 }}>
          Daily booked revenue, last {points.length} days (peak {fmt(max === 1 ? 0 : max)})
        </div>
        <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" role="img" aria-label={`Daily revenue chart for the last ${points.length} days`}>
          {points.map((p, i) => {
            const h = (p.revenue / max) * H
            return (
              <rect key={p.day} x={i * bw + bw * 0.15} y={H - h} width={Math.max(1, bw * 0.7)} height={Math.max(h, p.revenue ? 2 : 0)} rx={2} fill="#245B32">
                <title>{`${p.day}: ${fmt(p.revenue)}`}</title>
              </rect>
            )
          })}
          <line x1={0} x2={W} y1={H + 0.5} y2={H + 0.5} stroke="currentColor" opacity={0.25} />
          <text x={0} y={H + 14} fontSize={11} fill="currentColor" opacity={0.7}>{points[0]?.day}</text>
          <text x={W} y={H + 14} fontSize={11} fill="currentColor" opacity={0.7} textAnchor="end">{points.at(-1)?.day}</text>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, marginTop: 12 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Recent orders</h3>
          {recent.docs.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {recent.docs.map((o) => (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '6px 0' }}>
                      <Link href={`/admin/collections/orders/${o.id}`}>{o.orderNumber}</Link>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{o.customerName}</div>
                    </td>
                    <td>{o.status}</td>
                    <td>{o.paymentStatus}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Low stock</h3>
          {lowStock.rows.length === 0 ? (
            <p>Every published size is above its low-stock level.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {lowStock.rows.map((r) => (
                  <tr key={String(r.sku)} style={{ borderTop: '1px solid var(--theme-elevation-100)' }}>
                    <td style={{ padding: '6px 0' }}>
                      <Link href={`/admin/collections/products/${r.id}`}>{String(r.name ?? r.sku)}</Link>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{String(r.sku)}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: Number(r.stock) === 0 ? 'var(--theme-error-500)' : undefined }}>
                      {Number(r.stock)} left
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p style={{ marginBottom: 0 }}>
            <Link href="/admin/collections/stock-adjustments/create">Add stock</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

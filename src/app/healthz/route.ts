import { sql } from '@payloadcms/db-postgres'
import { getPayloadClient } from '@/server/payload'

export const dynamic = 'force-dynamic'

/** Liveness + database readiness for Docker/PM2/uptime monitors. Reveals nothing beyond ok/unavailable. */
export async function GET() {
  try {
    const payload = await getPayloadClient()
    const db = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
    await db.drizzle.execute(sql`select 1`)
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

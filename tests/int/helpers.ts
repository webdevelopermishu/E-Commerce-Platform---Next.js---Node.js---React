import { sql } from '@payloadcms/db-postgres'
import pg from 'pg'
import { getPayload, type Payload } from 'payload'

let instance: Payload | null = null

async function ensureDatabase(): Promise<void> {
  const url = new URL(process.env.DATABASE_URL!)
  const dbName = url.pathname.slice(1)
  const admin = new URL(url)
  admin.pathname = '/postgres'
  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  try {
    const exists = await client.query('select 1 from pg_database where datname = $1', [dbName])
    if (!exists.rowCount) await client.query(`create database "${dbName.replace(/"/g, '')}"`)
  } catch (e) {
    throw new Error(`Could not create test database ${dbName}: ${(e as Error).message}. Create it manually (see README → Testing).`)
  } finally {
    await client.end()
  }
}

/** A Payload instance on a freshly migrated, empty test database. */
export async function freshPayload(): Promise<Payload> {
  if (!instance) {
    await ensureDatabase()
    const { default: config } = await import('../../src/payload.config')
    instance = await getPayload({ config })
  }
  const db = instance.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
  await db.drizzle.execute(sql`drop schema if exists public cascade; create schema public;`)
  await instance.db.migrate()
  return instance
}

export const taka = (n: number) => n * 100

/** Minimal store: delivery zones, COD on, one category and products. */
export async function seedMinimalStore(payload: Payload) {
  await payload.updateGlobal({
    slug: 'delivery-settings',
    locale: 'bn',
    data: {
      zones: [
        { code: 'dhaka', name: 'ঢাকা', enabled: true, isDefault: false, fee: taka(80), freeOver: taka(3000), districts: ['dhaka'] as never },
        { code: 'outside', name: 'ঢাকার বাইরে', enabled: true, isDefault: true, fee: taka(150), districts: [] },
      ],
      methods: [{ code: 'standard', name: 'স্ট্যান্ডার্ড', surcharge: 0, enabled: true }],
    },
  })
  await payload.updateGlobal({ slug: 'payment-settings', data: { codEnabled: true, sslcommerzEnabled: false, bkashEnabled: false, nagadEnabled: false } })
  const cat = await payload.create({ collection: 'categories', locale: 'bn', data: { name: 'আম', slug: 'mango', status: 'published' } })
  const product = await payload.create({
    collection: 'products',
    locale: 'bn',
    data: {
      name: 'হিমসাগর আম',
      shortDescription: 'মিষ্টি আম',
      slug: 'himsagar',
      status: 'published',
      categories: [cat.id],
      variants: [
        { label: '৫ কেজি', sku: 'T-HIM-5', packSize: 5, unit: 'kg', price: taka(850), stock: 5, lowStockThreshold: 2 },
        { label: '১০ কেজি', sku: 'T-HIM-10', packSize: 10, unit: 'kg', price: taka(1700), salePrice: taka(1600), stock: 1, lowStockThreshold: 2 },
      ],
    },
  })
  const draft = await payload.create({
    collection: 'products',
    locale: 'bn',
    data: { name: 'খসড়া', slug: 'draft-item', status: 'draft', categories: [cat.id], variants: [{ label: '১', sku: 'T-DRAFT', unit: 'pcs', price: taka(100), stock: 10 }] },
  })
  return { cat, product, draft }
}

export const validForm = {
  name: 'Test Customer',
  phone: '01712345678',
  email: '',
  division: 'dhaka',
  district: 'dhaka',
  area: 'Dhanmondi',
  address: 'House 1, Road 2, Dhanmondi',
  notes: '',
  deliveryMethod: 'standard',
  paymentMethod: 'cod' as const,
}

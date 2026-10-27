import type { Endpoint, PayloadRequest } from 'payload'
import { hasRole } from '../../access'
import { slugify } from '../../fields/slug'
import type { Category, Product } from '../../payload-types'
import { parseCsv, poishaToTaka, toCsv } from './csv'
import { withPreservedLocale } from '../preserve-locale'

export const PRODUCT_CSV_HEADER = [
  'sku', 'product_slug', 'status', 'name_bn', 'name_en', 'short_bn', 'short_en', 'size_bn', 'size_en',
  'categories', 'price_bdt', 'sale_price_bdt', 'stock', 'featured',
] as const

type LocalizedProduct = Omit<Product, 'name' | 'shortDescription' | 'variants' | 'categories'> & {
  name: Record<string, string>
  shortDescription?: Record<string, string>
  categories: (Category | number)[]
  variants: (Omit<NonNullable<Product['variants']>[number], 'label'> & { label: Record<string, string> })[]
}

/** GET /api/products/export.csv — one row per size/pack. */
export const productsExportEndpoint: Endpoint = {
  path: '/export.csv',
  method: 'get',
  handler: async (req) => {
    if (!hasRole(req.user as never, 'admin', 'manager', 'editor')) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const res = await withPreservedLocale(req, () =>
      req.payload.find({ collection: 'products', locale: 'all', depth: 1, limit: 5000, pagination: false, req, overrideAccess: true }),
    )
    const rows: unknown[][] = []
    for (const p of res.docs as unknown as LocalizedProduct[]) {
      const cats = p.categories.map((c) => (typeof c === 'object' ? c.slug : c)).join('|')
      for (const v of p.variants ?? []) {
        rows.push([
          v.sku, p.slug, p.status, p.name?.bn ?? '', p.name?.en ?? '', p.shortDescription?.bn ?? '', p.shortDescription?.en ?? '',
          v.label?.bn ?? '', v.label?.en ?? '', cats, poishaToTaka(v.price), poishaToTaka(v.salePrice), v.stock ?? 0, p.featured ? 'yes' : 'no',
        ])
      }
    }
    return new Response(toCsv([...PRODUCT_CSV_HEADER], rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  },
}

const takaToPoisha = (s: string): number | null | 'invalid' => {
  const t = s.trim().replace(/,/g, '')
  if (!t) return null
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return 'invalid'
  const [w, f = ''] = t.split('.')
  return Number(w) * 100 + Number(f.padEnd(2, '0'))
}

/**
 * POST /api/products/import (multipart, field "file").
 * - Existing SKU → updates that size's price/sale price and the product's names/descriptions/status/featured.
 * - Unknown SKU + unknown product_slug → creates a new product (hidden by default unless status=published).
 * - Unknown SKU + existing product_slug → adds a new size to that product.
 * Stock is only set for newly created sizes; existing stock changes go through stock adjustments.
 */
export const productsImportEndpoint: Endpoint = {
  path: '/import',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!hasRole(req.user as never, 'admin', 'manager')) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const form = await req.formData?.().catch(() => null)
    const file = form?.get('file')
    if (!file || typeof file === 'string') return Response.json({ error: 'Attach a CSV file in the "file" field.' }, { status: 400 })
    if (file.size > 2 * 1024 * 1024) return Response.json({ error: 'CSV is larger than 2 MB.' }, { status: 400 })
    const rows = parseCsv(await file.text())
    const header = rows.shift()?.map((h) => h.trim().toLowerCase()) ?? []
    const missing = ['sku', 'product_slug', 'name_bn', 'price_bdt'].filter((h) => !header.includes(h))
    if (missing.length) return Response.json({ error: `Missing columns: ${missing.join(', ')}` }, { status: 400 })
    if (rows.length > 2000) return Response.json({ error: 'At most 2000 rows per import.' }, { status: 400 })

    const allCats = await req.payload.find({ collection: 'categories', limit: 500, depth: 0, pagination: false, req, overrideAccess: true })
    const catBySlug = new Map(allCats.docs.map((c) => [c.slug, c.id]))
    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const [i, r] of rows.entries()) {
      const get = (k: string) => (r[header.indexOf(k)] ?? '').trim()
      const line = i + 2
      try {
        const sku = get('sku').toUpperCase()
        const slug = slugify(get('product_slug'))
        const price = takaToPoisha(get('price_bdt'))
        const sale = takaToPoisha(get('sale_price_bdt'))
        if (!sku || !slug) throw new Error('sku and product_slug are required')
        if (price === 'invalid' || price === null || sale === 'invalid') throw new Error('invalid price')
        const categories = get('categories').split('|').map((s) => catBySlug.get(s.trim())).filter((x): x is number => typeof x === 'number')
        const status = get('status') === 'published' ? 'published' : get('status') === 'draft' ? 'draft' : undefined
        const featured = get('featured') ? ['yes', 'true', '1'].includes(get('featured').toLowerCase()) : undefined
        const stock = Math.max(0, Math.floor(Number(get('stock')) || 0))

        const bySku = await req.payload.find({ collection: 'products', where: { 'variants.sku': { equals: sku } }, limit: 1, depth: 0, req, overrideAccess: true, locale: 'bn' })
        const bySlug = bySku.docs[0]
          ? null
          : await req.payload.find({ collection: 'products', where: { slug: { equals: slug } }, limit: 1, depth: 0, req, overrideAccess: true, locale: 'bn' })
        const product = bySku.docs[0] ?? bySlug?.docs[0]

        if (!product) {
          if (!categories.length) throw new Error('new products need at least one valid category slug')
          const doc = await req.payload.create({
            collection: 'products',
            locale: 'bn',
            req,
            overrideAccess: true,
            data: {
              name: get('name_bn') || get('name_en'),
              shortDescription: get('short_bn') || undefined,
              slug,
              status: status ?? 'draft',
              featured: featured ?? false,
              categories,
              variants: [{ label: get('size_bn') || get('size_en') || '১টি', sku, price, salePrice: sale ?? undefined, stock }],
            },
          })
          if (get('name_en')) {
            await req.payload.update({
              collection: 'products', id: doc.id, locale: 'en', req, overrideAccess: true,
              data: {
                name: get('name_en'),
                shortDescription: get('short_en') || undefined,
                variants: (doc.variants ?? []).map((v) => ({ ...v, label: get('size_en') || v.label })),
              },
            })
          }
          created++
          continue
        }

        // Existing sizes are sent WITHOUT stock: Payload keeps the stored value, so the import can never
        // overwrite stock that changed because of a sale while the import was running.
        const variants = (product.variants ?? []).map(({ stock: _stock, ...v }) => ({ ...v })) as Record<string, unknown>[]
        const existing = variants.find((v) => v.sku === sku) as { price?: number; salePrice?: number | null; label?: string } | undefined
        if (existing) {
          existing.price = price
          existing.salePrice = sale ?? null
          if (get('size_bn')) existing.label = get('size_bn')
        } else {
          variants.push({ label: get('size_bn') || get('size_en') || sku, sku, price, salePrice: sale ?? null, stock })
        }
        await req.payload.update({
          collection: 'products', id: product.id, locale: 'bn', req, overrideAccess: true,
          data: {
            ...(get('name_bn') ? { name: get('name_bn') } : {}),
            ...(get('short_bn') ? { shortDescription: get('short_bn') } : {}),
            ...(status ? { status } : {}),
            ...(featured !== undefined ? { featured } : {}),
            ...(categories.length ? { categories } : {}),
            variants: variants as never,
          },
        })
        if (get('name_en') || get('short_en') || get('size_en')) {
          const fresh = await req.payload.findByID({ collection: 'products', id: product.id, locale: 'en', depth: 0, req, overrideAccess: true })
          await req.payload.update({
            collection: 'products', id: product.id, locale: 'en', req, overrideAccess: true,
            data: {
              ...(get('name_en') ? { name: get('name_en') } : {}),
              ...(get('short_en') ? { shortDescription: get('short_en') } : {}),
              variants: (fresh.variants ?? []).map(({ stock: _stock, ...v }) => (v.sku === sku && get('size_en') ? { ...v, label: get('size_en') } : v)) as never,
            },
          })
        }
        updated++
      } catch (e) {
        errors.push(`row ${line}: ${e instanceof Error ? e.message : 'error'}`)
      }
    }
    return Response.json({ created, updated, errors })
  },
}

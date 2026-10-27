import type { MetadataRoute } from 'next'
import { locales } from '@/lib/i18n/config'
import { env } from '@/server/env'
import { getPayloadClient } from '@/server/payload'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

/**
 * One entry per language for every public URL, each listing its bn/en alternates (hreflang).
 * Only published, indexable content is included.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SERVER_URL
  const payload = await getPayloadClient()
  const common = { depth: 0, limit: 5000, pagination: false, overrideAccess: false } as const
  const indexable = { 'seo.noindex': { not_equals: true } } as const
  const [products, categories, posts, pages] = await Promise.all([
    payload.find({ collection: 'products', ...common, where: { and: [{ status: { equals: 'published' } }, indexable] }, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'categories', ...common, where: { and: [{ status: { equals: 'published' } }, indexable] }, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'posts', ...common, where: { and: [{ status: { equals: 'published' } }, indexable] }, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'pages', ...common, where: { and: [{ status: { equals: 'published' } }, indexable] }, select: { slug: true, updatedAt: true } }),
  ])

  const entries: Entry[] = []
  const add = (path: string, lastModified?: string, priority = 0.6, changeFrequency: Entry['changeFrequency'] = 'weekly') => {
    const languages = Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`]))
    for (const l of locales) {
      entries.push({ url: `${base}/${l}${path}`, lastModified: lastModified ? new Date(lastModified) : undefined, changeFrequency, priority, alternates: { languages } })
    }
  }

  add('', undefined, 1, 'daily')
  add('/shop', undefined, 0.9, 'daily')
  add('/blog', undefined, 0.5)
  for (const c of categories.docs) add(`/category/${c.slug}`, c.updatedAt, 0.8, 'daily')
  for (const p of products.docs) add(`/product/${p.slug}`, p.updatedAt, 0.8, 'daily')
  for (const p of posts.docs) add(`/blog/${p.slug}`, p.updatedAt, 0.5, 'monthly')
  for (const p of pages.docs) add(`/pages/${p.slug}`, p.updatedAt, 0.3, 'monthly')
  return entries
}

import 'server-only'
import { headers } from 'next/headers'
import type { Where } from 'payload'
import { cache } from 'react'
import { hasRole } from '../access'
import type { Locale } from '../lib/i18n/config'
import { effectivePrice } from '../lib/pricing'
import type { Category, Media, Post, Product } from '../payload-types'
import { mediaDims, mediaUrl } from './media-url'
import { getPayloadClient } from './payload'

/**
 * Storefront reads. Public reads run with access control as an anonymous visitor (overrideAccess: false),
 * so hidden products, draft posts and unmoderated reviews can never appear. Staff previews are explicit.
 */

export interface ImageData {
  url: string
  width: number
  height: number
  alt: string
}

export function toImage(media: Media | number | null | undefined, size: 'thumbnail' | 'card' | 'large' | 'og' = 'card'): ImageData | null {
  if (!media || typeof media !== 'object') return null
  const url = mediaUrl(media, size)
  const dims = mediaDims(media, size)
  if (!url || !dims) return null
  return { url, ...dims, alt: media.alt ?? '' }
}

export interface VariantData {
  id: string
  label: string
  sku: string
  price: number
  regularPrice: number
  onSale: boolean
  discountPercent: number
  stock: number
  lowStockThreshold: number
}

export interface ProductCardData {
  id: number
  slug: string
  name: string
  shortDescription: string
  image: ImageData | null
  variants: VariantData[]
  isBundle: boolean
  featured: boolean
}

export function toVariants(p: Product): VariantData[] {
  return (p.variants ?? []).map((v) => {
    const ep = effectivePrice({ price: v.price, salePrice: v.salePrice, saleStartsAt: v.saleStartsAt, saleEndsAt: v.saleEndsAt })
    return {
      id: v.id!,
      label: v.label,
      sku: v.sku,
      price: ep.unitPrice,
      regularPrice: ep.regularPrice,
      onSale: ep.onSale,
      discountPercent: ep.discountPercent,
      stock: Math.max(0, v.stock ?? 0),
      lowStockThreshold: v.lowStockThreshold ?? 5,
    }
  })
}

export function toCard(p: Product): ProductCardData {
  const first = Array.isArray(p.images) ? (p.images[0] as Media | number | undefined) : undefined
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription ?? '',
    image: toImage(first, 'card'),
    variants: toVariants(p),
    isBundle: Boolean(p.isBundle),
    featured: Boolean(p.featured),
  }
}

/** True when the current request comes from a logged-in staff user (for previews of hidden content). */
export const isStaffRequest = cache(async (): Promise<boolean> => {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: await headers() })
    return hasRole(user as never, 'admin', 'manager', 'editor')
  } catch {
    return false
  }
})

export const getSiteSettings = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const [branding, contact, navigation, analytics] = await Promise.all([
    payload.findGlobal({ slug: 'branding', locale, depth: 1 }),
    payload.findGlobal({ slug: 'contact-settings', locale, depth: 0 }),
    payload.findGlobal({ slug: 'navigation', locale, depth: 0 }),
    payload.findGlobal({ slug: 'analytics-settings', depth: 0 }),
  ])
  return { branding, contact, navigation, analytics }
})

export const getHomepage = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'homepage', locale, depth: 1 })
})

export const getDeliveryNote = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const d = await payload.findGlobal({ slug: 'delivery-settings', locale, depth: 0 })
  return d.productPageNote ?? ''
})

export const getCategories = cache(async (locale: Locale): Promise<Category[]> => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'categories', locale, depth: 1, limit: 200, sort: 'sortOrder', overrideAccess: false, pagination: false })
  return res.docs
})

export const getCategoryBySlug = cache(async (locale: Locale, slug: string): Promise<Category | null> => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'categories', locale, depth: 1, limit: 1, where: { slug: { equals: slug } }, overrideAccess: false })
  return res.docs[0] ?? null
})

export type SortKey = 'featured' | 'newest' | 'price_asc' | 'price_desc'

export interface ProductQuery {
  category?: string
  q?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  sort?: SortKey
  page?: number
  limit?: number
  ids?: number[]
  excludeId?: number
  featured?: boolean
  bestSeller?: boolean
}

const SORTS: Record<SortKey, string[]> = {
  featured: ['-featured', 'sortOrder', '-createdAt'],
  newest: ['-createdAt'],
  price_asc: ['minPrice', 'sortOrder'],
  price_desc: ['-minPrice', 'sortOrder'],
}

export async function listProducts(locale: Locale, q: ProductQuery = {}) {
  const payload = await getPayloadClient()
  const and: Where[] = [{ status: { equals: 'published' } }]
  if (q.category) {
    const cat = await getCategoryBySlug(locale, q.category)
    if (!cat) return { docs: [] as ProductCardData[], totalDocs: 0, totalPages: 0, page: 1 }
    // Include direct child categories.
    const children = (await getCategories(locale)).filter((c) => (typeof c.parent === 'object' ? c.parent?.id : c.parent) === cat.id)
    and.push({ categories: { in: [cat.id, ...children.map((c) => c.id)] } })
  }
  if (q.q?.trim()) and.push({ searchText: { like: q.q.trim().toLowerCase().slice(0, 80) } })
  if (q.inStock) and.push({ totalStock: { greater_than: 0 } })
  if (q.minPrice != null) and.push({ minPrice: { greater_than_equal: q.minPrice } })
  if (q.maxPrice != null) and.push({ minPrice: { less_than_equal: q.maxPrice } })
  if (q.ids?.length) and.push({ id: { in: q.ids } })
  if (q.excludeId) and.push({ id: { not_equals: q.excludeId } })
  if (q.featured) and.push({ featured: { equals: true } })
  if (q.bestSeller) and.push({ or: [{ bestSeller: { equals: true } }, { isBundle: { equals: true } }] })

  const res = await payload.find({
    collection: 'products',
    locale,
    depth: 1,
    where: { and },
    sort: SORTS[q.sort ?? 'featured'],
    page: q.page ?? 1,
    limit: q.limit ?? 12,
    overrideAccess: false,
  })
  let docs = res.docs.map(toCard)
  if (q.ids?.length) docs = q.ids.map((id) => docs.find((d) => d.id === id)).filter((d): d is ProductCardData => Boolean(d))
  return { docs, totalDocs: res.totalDocs, totalPages: res.totalPages, page: res.page ?? 1 }
}

export const getProductBySlug = cache(async (locale: Locale, slug: string, preview = false): Promise<Product | null> => {
  const payload = await getPayloadClient()
  const staff = preview && (await isStaffRequest())
  const res = await payload.find({
    collection: 'products',
    locale,
    depth: 2,
    limit: 1,
    where: staff ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    overrideAccess: staff,
  })
  return res.docs[0] ?? null
})

/** Slugs of products in both languages share the same value — used for language switching and hreflang. */
export async function findRedirect(type: 'product' | 'category' | 'post' | 'page', slug: string): Promise<string | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'redirects',
    where: { and: [{ type: { equals: type } }, { fromSlug: { equals: slug } }] },
    limit: 1,
    depth: 0,
  })
  return res.docs[0]?.toSlug ?? null
}

export const getFaqs = cache(async (locale: Locale, homeOnly = false) => {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'faqs',
    locale,
    depth: 0,
    limit: 50,
    sort: 'sortOrder',
    where: homeOnly ? { showOnHome: { equals: true } } : undefined,
    overrideAccess: false,
  })
  return res.docs
})

export const getTestimonials = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'testimonials', locale, depth: 0, limit: 6, sort: '-createdAt', overrideAccess: false })
  return res.docs
})

export async function listPosts(locale: Locale, page = 1, limit = 9) {
  const payload = await getPayloadClient()
  return payload.find({ collection: 'posts', locale, depth: 1, page, limit, sort: '-publishedAt', overrideAccess: false })
}

export const getPostBySlug = cache(async (locale: Locale, slug: string, preview = false): Promise<Post | null> => {
  const payload = await getPayloadClient()
  const staff = preview && (await isStaffRequest())
  const res = await payload.find({
    collection: 'posts',
    locale,
    depth: 1,
    limit: 1,
    where: staff ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    overrideAccess: staff,
  })
  return res.docs[0] ?? null
})

export const getPageBySlug = cache(async (locale: Locale, slug: string, preview = false) => {
  const payload = await getPayloadClient()
  const staff = preview && (await isStaffRequest())
  const res = await payload.find({
    collection: 'pages',
    locale,
    depth: 1,
    limit: 1,
    where: staff ? { slug: { equals: slug } } : { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    overrideAccess: staff,
  })
  return res.docs[0] ?? null
})

export const getPolicyPages = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'pages', locale, depth: 0, limit: 20, overrideAccess: false, sort: 'title' })
  return res.docs
})

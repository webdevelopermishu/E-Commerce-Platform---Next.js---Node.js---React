import type { Payload, PayloadRequest } from 'payload'
import type { CatalogProduct } from '../lib/cart-math'
import type { CouponRule } from '../lib/coupons'
import type { DeliveryMethod, DeliveryZone } from '../lib/delivery'
import type { Locale } from '../lib/i18n/config'
import { pickLocalized } from '../lib/i18n'
import { mediaUrl } from './media-url'
import type { Coupon, Media, Product } from '../payload-types'
import { withPreservedLocale } from './preserve-locale'

export interface ProductSnapshot extends CatalogProduct {
  nameBn: string
  nameEn: string
  variantNames: Record<string, { bn: string; en: string }>
}

/**
 * Load the products referenced by a cart with ALL locales, so prices/stock come from the DB
 * and both language names can be snapshotted into the order.
 */
export async function loadCatalogForCart(
  payload: Payload,
  productIds: (string | number)[],
  locale: Locale,
  req?: Partial<PayloadRequest>,
): Promise<Map<string, ProductSnapshot>> {
  const ids = [...new Set(productIds.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))]
  const map = new Map<string, ProductSnapshot>()
  if (!ids.length) return map
  const res = await withPreservedLocale(req, () => payload.find({
    collection: 'products',
    where: { id: { in: ids } },
    locale: 'all',
    depth: 1,
    limit: ids.length,
    overrideAccess: true,
    pagination: false,
    req,
  }))
  for (const p of res.docs as unknown as (Omit<Product, 'name' | 'variants'> & {
    name: Record<string, string>
    variants: (Omit<NonNullable<Product['variants']>[number], 'label'> & { label: Record<string, string> })[]
  })[]) {
    const firstImage = Array.isArray(p.images) ? (p.images[0] as Media | number | undefined) : undefined
    const variantNames: ProductSnapshot['variantNames'] = {}
    const variants = (p.variants ?? []).map((v) => {
      variantNames[v.id!] = { bn: pickLocalized(v.label, 'bn'), en: pickLocalized(v.label, 'en') }
      return {
        id: v.id!,
        sku: v.sku,
        label: pickLocalized(v.label, locale),
        price: v.price,
        salePrice: v.salePrice ?? null,
        saleStartsAt: v.saleStartsAt ?? null,
        saleEndsAt: v.saleEndsAt ?? null,
        stock: v.stock ?? 0,
      }
    })
    map.set(String(p.id), {
      id: p.id,
      slug: p.slug,
      name: pickLocalized(p.name, locale),
      nameBn: pickLocalized(p.name, 'bn'),
      nameEn: pickLocalized(p.name, 'en'),
      published: p.status === 'published',
      imageUrl: typeof firstImage === 'object' && firstImage ? mediaUrl(firstImage, 'thumbnail') : null,
      variants,
      variantNames,
    })
  }
  return map
}

export async function loadCoupon(payload: Payload, code: string | undefined, req?: Partial<PayloadRequest>): Promise<(CouponRule & { id: number }) | null> {
  if (!code) return null
  const res = await payload.find({
    collection: 'coupons',
    where: { code: { equals: code } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const c = res.docs[0] as Coupon | undefined
  if (!c) return null
  return {
    id: c.id,
    code: c.code,
    active: Boolean(c.active),
    type: c.type,
    value: c.type === 'percent' ? (c.percent ?? 0) : (c.amount ?? 0),
    minSubtotal: c.minSubtotal ?? null,
    maxDiscount: c.maxDiscount ?? null,
    startsAt: c.startsAt ?? null,
    endsAt: c.endsAt ?? null,
    usageLimit: c.usageLimit ?? null,
    usedCount: c.usedCount ?? 0,
  }
}

export interface DeliveryConfig {
  zones: (DeliveryZone & { name: string; estimate: string })[]
  methods: (DeliveryMethod & { name: string; description: string })[]
  productPageNote: string
}

export async function loadDeliveryConfig(payload: Payload, locale: Locale, req?: Partial<PayloadRequest>): Promise<DeliveryConfig> {
  const d = await payload.findGlobal({ slug: 'delivery-settings', locale, depth: 0, overrideAccess: true, req })
  return {
    zones: (d.zones ?? []).map((z) => ({
      code: z.code,
      name: z.name ?? z.code,
      estimate: z.estimate ?? '',
      fee: z.fee ?? 0,
      freeOver: z.freeOver ?? null,
      districts: (z.districts as string[] | null) ?? [],
      isDefault: z.isDefault ?? false,
      enabled: z.enabled ?? true,
    })),
    methods: (d.methods ?? [])
      .filter((m) => m.enabled !== false)
      .map((m) => ({ code: m.code, name: m.name ?? m.code, description: m.description ?? '', surcharge: m.surcharge ?? 0, enabled: true })),
    productPageNote: d.productPageNote ?? '',
  }
}

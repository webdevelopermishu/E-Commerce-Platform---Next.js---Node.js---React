import { evaluateCoupon, type CouponError, type CouponRule } from './coupons'
import { deliveryFee, resolveZone, type DeliveryMethod, type DeliveryZone } from './delivery'
import { multiply, sum, type Poisha } from './money'
import { effectivePrice, type PriceableVariant } from './pricing'

/** What the browser sends: identifiers and quantities only — never prices. */
export interface CartLineInput {
  productId: string | number
  variantId: string
  quantity: number
}

export interface CatalogVariant extends PriceableVariant {
  id: string
  sku: string
  label: string
  stock: number
  weightLabel?: string | null
}

export interface CatalogProduct {
  id: string | number
  slug: string
  name: string
  published: boolean
  imageUrl?: string | null
  variants: CatalogVariant[]
}

export type LineIssue = 'product_unavailable' | 'variant_unavailable' | 'out_of_stock' | 'insufficient_stock' | 'invalid_quantity'

export interface PricedLine {
  productId: string | number
  variantId: string
  slug: string
  name: string
  variantLabel: string
  sku: string
  imageUrl?: string | null
  quantity: number
  unitPrice: Poisha
  regularPrice: Poisha
  lineTotal: Poisha
  available: number
  issue?: LineIssue
}

export interface CartTotals {
  lines: PricedLine[]
  subtotal: Poisha
  discount: Poisha
  couponCode?: string
  couponError?: CouponError
  shipping: Poisha
  total: Poisha
  itemCount: number
  /** true when every line can be purchased as requested */
  purchasable: boolean
}

export const MAX_QTY_PER_LINE = 50

/**
 * Price a cart entirely from catalog data. Lines with issues are kept (so the UI can show them)
 * but excluded from totals.
 */
export function priceCart(params: {
  items: CartLineInput[]
  catalog: Map<string, CatalogProduct>
  coupon?: CouponRule | null
  couponCode?: string
  zones?: DeliveryZone[]
  district?: string | null
  method?: DeliveryMethod | null
  now?: Date
}): CartTotals {
  const { items, catalog, coupon, couponCode, zones = [], district, method = null, now = new Date() } = params

  // Merge duplicate lines for the same variant.
  const merged = new Map<string, CartLineInput>()
  for (const item of items) {
    const key = `${item.productId}:${item.variantId}`
    const prev = merged.get(key)
    merged.set(key, { ...item, quantity: (prev?.quantity ?? 0) + item.quantity })
  }

  const lines: PricedLine[] = []
  for (const item of merged.values()) {
    const product = catalog.get(String(item.productId))
    const variant = product?.variants.find((v) => v.id === item.variantId)
    const base = {
      productId: item.productId,
      variantId: item.variantId,
      slug: product?.slug ?? '',
      name: product?.name ?? '',
      variantLabel: variant?.label ?? '',
      sku: variant?.sku ?? '',
      imageUrl: product?.imageUrl,
      quantity: item.quantity,
    }
    if (!product || !product.published) {
      lines.push({ ...base, unitPrice: 0, regularPrice: 0, lineTotal: 0, available: 0, issue: 'product_unavailable' })
      continue
    }
    if (!variant) {
      lines.push({ ...base, unitPrice: 0, regularPrice: 0, lineTotal: 0, available: 0, issue: 'variant_unavailable' })
      continue
    }
    const price = effectivePrice(variant, now)
    const available = Math.max(0, variant.stock)
    let issue: LineIssue | undefined
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QTY_PER_LINE) issue = 'invalid_quantity'
    else if (available === 0) issue = 'out_of_stock'
    else if (item.quantity > available) issue = 'insufficient_stock'

    lines.push({
      ...base,
      unitPrice: price.unitPrice,
      regularPrice: price.regularPrice,
      lineTotal: issue ? 0 : multiply(price.unitPrice, item.quantity),
      available,
      issue,
    })
  }

  const valid = lines.filter((l) => !l.issue)
  const subtotal = sum(valid.map((l) => l.lineTotal))

  let discount = 0
  let couponError: CouponError | undefined
  if (couponCode) {
    const result = evaluateCoupon(coupon, subtotal, now)
    if (result.ok) discount = result.discount
    else couponError = result.error
  }

  const zone = resolveZone(zones, district)
  const shipping = valid.length > 0 ? deliveryFee(zone, method, subtotal - discount) : 0
  const total = subtotal - discount + shipping

  return {
    lines,
    subtotal,
    discount,
    couponCode: couponCode && !couponError ? couponCode : undefined,
    couponError,
    shipping,
    total,
    itemCount: valid.reduce((n, l) => n + l.quantity, 0),
    purchasable: valid.length > 0 && valid.length === lines.length,
  }
}

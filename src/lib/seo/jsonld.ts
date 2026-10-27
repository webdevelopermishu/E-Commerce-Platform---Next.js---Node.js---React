/**
 * Structured data builders. Everything here must match what is visible on the page:
 * real price, real stock, real reviews only. AggregateRating is emitted only when genuine ratings exist.
 */

export type JsonLd = Record<string, unknown>

const money = (poisha: number) => (poisha / 100).toFixed(2)

export function organizationLd(o: { name: string; url: string; logoUrl?: string | null; phone?: string | null; email?: string | null; sameAs?: string[] }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: o.name,
    url: o.url,
    ...(o.logoUrl ? { logo: o.logoUrl } : {}),
    ...(o.phone || o.email
      ? { contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: o.phone || undefined, email: o.email || undefined, areaServed: 'BD', availableLanguage: ['bn', 'en'] }] }
      : {}),
    ...(o.sameAs?.length ? { sameAs: o.sameAs } : {}),
  }
}

export function websiteLd(w: { name: string; url: string; locale: string; searchUrl: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: w.name,
    url: w.url,
    inLanguage: w.locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${w.searchUrl}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbLd(items: { name: string; url: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  }
}

export interface ProductLdInput {
  name: string
  description: string
  url: string
  images: string[]
  sku: string
  brand: string
  locale: string
  category?: string
  variants: { sku: string; name: string; price: number; inStock: boolean; saleEndsAt?: string | null }[]
  ratings?: number[]
}

export function productLd(p: ProductLdInput): JsonLd {
  const offers = p.variants.map((v) => ({
    '@type': 'Offer',
    sku: v.sku,
    name: v.name,
    url: p.url,
    priceCurrency: 'BDT',
    price: money(v.price),
    ...(v.saleEndsAt ? { priceValidUntil: v.saleEndsAt.slice(0, 10) } : {}),
    availability: v.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  }))
  const prices = p.variants.map((v) => v.price)
  const ratings = (p.ratings ?? []).filter((r) => Number.isFinite(r) && r >= 1 && r <= 5)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    url: p.url,
    sku: p.sku,
    inLanguage: p.locale,
    image: p.images,
    brand: { '@type': 'Brand', name: p.brand },
    ...(p.category ? { category: p.category } : {}),
    offers:
      offers.length === 1
        ? offers[0]
        : {
            '@type': 'AggregateOffer',
            priceCurrency: 'BDT',
            lowPrice: money(Math.min(...prices)),
            highPrice: money(Math.max(...prices)),
            offerCount: offers.length,
            offers,
          },
    ...(ratings.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
            reviewCount: ratings.length,
          },
        }
      : {}),
  }
}

export function articleLd(a: { headline: string; description: string; url: string; image?: string | null; datePublished: string; dateModified: string; author?: string | null; publisher: string; locale: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.headline,
    description: a.description,
    url: a.url,
    inLanguage: a.locale,
    ...(a.image ? { image: [a.image] } : {}),
    datePublished: a.datePublished,
    dateModified: a.dateModified,
    author: a.author ? { '@type': 'Person', name: a.author } : { '@type': 'Organization', name: a.publisher },
    publisher: { '@type': 'Organization', name: a.publisher },
  }
}

/** Safe serialization for <script type="application/ld+json"> (prevents </script> injection). */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

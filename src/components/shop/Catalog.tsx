import Link from 'next/link'
import { Suspense } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import { formatNumber, interpolate } from '@/lib/i18n/format'
import { listProducts, type SortKey } from '@/server/queries'
import { ProductGrid } from '../product/ProductCard'
import { CatalogControls } from './CatalogControls'

export type CatalogSearchParams = Record<string, string | string[] | undefined>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function parseCatalogParams(sp: CatalogSearchParams) {
  const takaToPoisha = (v?: string) => (v && /^\d{1,7}$/.test(v) ? Number(v) * 100 : undefined)
  const sort = one(sp.sort) as SortKey | undefined
  const page = Math.max(1, Math.min(500, Number(one(sp.page)) || 1))
  return {
    q: one(sp.q)?.slice(0, 80),
    sort: sort && ['featured', 'newest', 'price_asc', 'price_desc'].includes(sort) ? sort : 'featured',
    page,
    inStock: one(sp.stock) === '1',
    minPrice: takaToPoisha(one(sp.min)),
    maxPrice: takaToPoisha(one(sp.max)),
  } as const
}

/** Any parameter other than page changes the result set → those URLs are noindex. */
export function isFilteredView(sp: CatalogSearchParams): boolean {
  return Object.keys(sp).some((k) => k !== 'page' && one(sp[k]))
}

export async function Catalog({
  locale,
  dict,
  searchParams,
  category,
  categories,
  basePath,
}: {
  locale: Locale
  dict: Dictionary
  searchParams: CatalogSearchParams
  category?: string
  categories: { slug: string; name: string }[]
  basePath: string
}) {
  const p = parseCatalogParams(searchParams)
  const res = await listProducts(locale, { ...p, category, limit: 12 })
  const keep = new URLSearchParams()
  for (const [k, v] of Object.entries(searchParams)) if (k !== 'page' && one(v)) keep.set(k, one(v)!)
  const pageHref = (n: number) => {
    const qs = new URLSearchParams(keep)
    if (n > 1) qs.set('page', String(n))
    return `?${qs.toString()}`
  }

  return (
    <>
      <Suspense fallback={<div className="mb-8 h-10" />}>
        <CatalogControls categories={categories} activeCategory={category} basePath={basePath} />
      </Suspense>
      <p className="mb-5 text-sm text-ink-soft" role="status">
        {p.q ? `${interpolate(dict.shop.resultsFor, { query: p.q })} — ` : ''}
        {interpolate(dict.shop.resultCount, { count: formatNumber(res.totalDocs, locale) })}
      </p>
      {res.docs.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
          <p className="font-display text-2xl text-primary">{dict.shop.noResults}</p>
          <p className="mt-2 text-ink-soft">{dict.shop.noResultsHint}</p>
          <Link href={basePath} className="mt-6 inline-flex h-11 items-center rounded-[var(--radius-control)] bg-primary px-5 font-medium text-white hover:bg-primary-deep">
            {dict.shop.clearFilters}
          </Link>
        </div>
      ) : (
        <ProductGrid products={res.docs} locale={locale} dict={dict} priorityCount={4} />
      )}
      {res.totalPages > 1 && (
        <nav aria-label={dict.shop.pagination} className="mt-12 flex items-center justify-center gap-3">
          {res.page > 1 ? (
            <Link rel="prev" href={pageHref(res.page - 1)} className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-line px-4 hover:bg-leaf-tint">
              {dict.shop.previous}
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center px-4 text-ink-soft/50">{dict.shop.previous}</span>
          )}
          <span className="text-sm text-ink-soft">
            {interpolate(dict.shop.page, { page: formatNumber(res.page, locale), total: formatNumber(res.totalPages, locale) })}
          </span>
          {res.page < res.totalPages ? (
            <Link rel="next" href={pageHref(res.page + 1)} className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-line px-4 hover:bg-leaf-tint">
              {dict.shop.next}
            </Link>
          ) : (
            <span className="inline-flex h-11 items-center px-4 text-ink-soft/50">{dict.shop.next}</span>
          )}
        </nav>
      )}
    </>
  )
}

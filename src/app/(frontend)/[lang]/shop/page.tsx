import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Catalog, isFilteredView, parseCatalogParams, type CatalogSearchParams } from '@/components/shop/Catalog'
import { getDictionary } from '@/lib/i18n'
import { interpolate } from '@/lib/i18n/format'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { resolveLocale } from '@/server/page-helpers'
import { getCategories, getSiteSettings } from '@/server/queries'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<CatalogSearchParams> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const sp = await searchParams
  const dict = getDictionary(locale)
  const { branding } = await getSiteSettings(locale)
  const { page } = parseCatalogParams(sp)
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: '/shop',
    title: page > 1 ? `${dict.seo.shopTitle} — ${interpolate(dict.seo.pageSuffix, { page })}` : dict.seo.shopTitle,
    description: dict.seo.shopDescription,
    canonicalQuery: page > 1 ? `?page=${page}` : '',
    noindex: isFilteredView(sp),
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function ShopPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const sp = await searchParams
  const dict = getDictionary(locale)
  const categories = await getCategories(locale)
  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        baseUrl={env.NEXT_PUBLIC_SERVER_URL}
        items={[
          { name: dict.common.home, href: `/${locale}` },
          { name: dict.shop.title, href: `/${locale}/shop` },
        ]}
      />
      <h1 className="mt-4 mb-8 text-[clamp(2rem,4vw,3rem)] text-primary">{dict.shop.title}</h1>
      <Catalog
        locale={locale}
        dict={dict}
        searchParams={sp}
        // Without JavaScript the filter form submits ?category=… here; honour it.
        category={typeof sp.category === 'string' && categories.some((c) => c.slug === sp.category) ? sp.category : undefined}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        basePath={`/${locale}/shop`}
      />
    </div>
  )
}

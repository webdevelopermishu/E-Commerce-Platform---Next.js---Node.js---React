import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { Catalog, isFilteredView, parseCatalogParams, type CatalogSearchParams } from '@/components/shop/Catalog'
import { getDictionary } from '@/lib/i18n'
import { interpolate } from '@/lib/i18n/format'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { resolveLocale, seoFrom } from '@/server/page-helpers'
import { findRedirect, getCategories, getCategoryBySlug, getSiteSettings, toImage } from '@/server/queries'

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<CatalogSearchParams> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const sp = await searchParams
  const dict = getDictionary(locale)
  const [cat, { branding }] = await Promise.all([getCategoryBySlug(locale, slug), getSiteSettings(locale)])
  if (!cat) return {}
  const { page } = parseCatalogParams(sp)
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: `/category/${cat.slug}`,
    title: page > 1 ? `${cat.name} — ${interpolate(dict.seo.pageSuffix, { page })}` : cat.name,
    description: cat.description,
    imageUrl: toImage(cat.image as never, 'og')?.url,
    seo: seoFrom(cat.seo),
    canonicalQuery: page > 1 ? `?page=${page}` : '',
    noindex: isFilteredView(sp),
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const sp = await searchParams
  const dict = getDictionary(locale)
  const cat = await getCategoryBySlug(locale, slug)
  if (!cat) {
    const to = await findRedirect('category', slug)
    if (to) permanentRedirect(`/${locale}/category/${to}`)
    notFound()
  }
  const categories = await getCategories(locale)
  const banner = toImage(cat.banner as never, 'large')
  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        baseUrl={env.NEXT_PUBLIC_SERVER_URL}
        items={[
          { name: dict.common.home, href: `/${locale}` },
          { name: dict.shop.title, href: `/${locale}/shop` },
          { name: cat.name, href: `/${locale}/category/${cat.slug}` },
        ]}
      />
      <header className="mb-8 mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="text-[clamp(2rem,4.4vw,3.4rem)] text-primary">{cat.name}</h1>
          {cat.description && <p className="mt-3 max-w-[60ch] text-lg text-ink-soft">{cat.description}</p>}
        </div>
      </header>
      {banner && (
        <div className="relative mb-10 aspect-[16/5] overflow-hidden rounded-[var(--radius-card)] bg-mango-tint">
          <Image src={banner.url} alt={banner.alt} fill priority sizes="(min-width:1280px) 1216px, 100vw" className="object-cover" />
        </div>
      )}
      <Catalog
        locale={locale}
        dict={dict}
        searchParams={sp}
        category={cat.slug}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        basePath={`/${locale}/shop`}
      />
    </div>
  )
}

import { Truck } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ProductGrid } from '@/components/product/ProductCard'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductPurchase } from '@/components/product/ProductPurchase'
import { RichTextContent } from '@/components/RichTextContent'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { WhatsAppProduct } from '@/components/whatsapp/whatsapp-store'
import { getDictionary } from '@/lib/i18n'
import { productLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { getPayloadClient } from '@/server/payload'
import { resolveLocale, richTextToPlain, seoFrom } from '@/server/page-helpers'
import { findRedirect, getDeliveryNote, getProductBySlug, getSiteSettings, listProducts, toImage, toVariants, type ImageData } from '@/server/queries'
import type { Category, Media, Product } from '@/payload-types'

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ preview?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const preview = (await searchParams).preview === '1'
  const [product, { branding }] = await Promise.all([getProductBySlug(locale, slug, preview), getSiteSettings(locale)])
  if (!product) return {}
  const first = Array.isArray(product.images) ? (product.images[0] as Media) : null
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: `/product/${product.slug}`,
    title: product.name,
    description: product.shortDescription || richTextToPlain(product.description, 300),
    imageUrl: toImage(first, 'og')?.url,
    seo: seoFrom(product.seo),
    noindex: product.status !== 'published',
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function ProductPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const preview = (await searchParams).preview === '1'
  const dict = getDictionary(locale)
  const product = await getProductBySlug(locale, slug, preview)
  if (!product) {
    const to = await findRedirect('product', slug)
    if (to) permanentRedirect(`/${locale}/product/${to}`)
    notFound()
  }

  const images = ((product.images ?? []) as (Media | number)[]).map((m) => toImage(m, 'large')).filter((x): x is ImageData => Boolean(x))
  const variants = toVariants(product)
  const categories = (product.categories ?? []).filter((c): c is Category => typeof c === 'object')
  const primaryCat = categories[0]
  const baseUrl = env.NEXT_PUBLIC_SERVER_URL
  const url = `${baseUrl}/${locale}/product/${product.slug}`

  const relatedIds = (product.relatedProducts ?? []).map((p) => (typeof p === 'object' ? (p as Product).id : p))
  const [related, deliveryNote, { branding }, ratings] = await Promise.all([
    relatedIds.length
      ? listProducts(locale, { ids: relatedIds, limit: 4 })
      : primaryCat
        ? listProducts(locale, { category: primaryCat.slug, excludeId: product.id, limit: 4 })
        : Promise.resolve({ docs: [] }),
    getDeliveryNote(locale),
    getSiteSettings(locale),
    getPayloadClient().then((p) =>
      p.find({ collection: 'testimonials', where: { product: { equals: product.id } }, depth: 0, limit: 100, overrideAccess: false }),
    ),
  ])

  const description = product.shortDescription || richTextToPlain(product.description, 500)
  return (
    <div className="container-page py-6 md:py-10">
      <WhatsAppProduct name={product.name} />
      <Breadcrumbs
        label={dict.common.breadcrumb}
        baseUrl={baseUrl}
        items={[
          { name: dict.common.home, href: `/${locale}` },
          ...(primaryCat ? [{ name: primaryCat.name, href: `/${locale}/category/${primaryCat.slug}` }] : [{ name: dict.shop.title, href: `/${locale}/shop` }]),
          { name: product.name, href: `/${locale}/product/${product.slug}` },
        ]}
      />
      <div className="mt-5 grid gap-8 md:grid-cols-2 lg:gap-14">
        <ProductGallery images={images} name={product.name} />
        <div className="md:pt-2">
          <h1 className="text-[clamp(2rem,4vw,3rem)] text-primary">{product.name}</h1>
          {product.shortDescription && <p className="mt-3 text-lg text-ink-soft">{product.shortDescription}</p>}
          <div className="mt-6">
            <ProductPurchase product={{ id: product.id, slug: product.slug, name: product.name, imageUrl: images[0]?.url ?? null }} variants={variants} />
          </div>
          <div className="mt-8 flex gap-3 rounded-[var(--radius-card)] bg-leaf-tint p-4">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
            <div>
              <p className="font-semibold">{dict.product.delivery}</p>
              <p className="text-sm text-ink/85">{deliveryNote || dict.product.deliveryNote}</p>
            </div>
          </div>
          {(product.attributes?.length ?? 0) > 0 && (
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {product.attributes!.map((a) => (
                <div key={a.id ?? a.label} className="grid grid-cols-[40%_1fr] gap-4 py-3 text-[0.95rem]">
                  <dt className="text-ink-soft">{a.label}</dt>
                  <dd className="font-medium">{a.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {product.description ? (
        <section className="mt-14 md:mt-20" aria-labelledby="desc-title">
          <h2 id="desc-title" className="mb-4 text-3xl text-primary">
            {dict.product.description}
          </h2>
          <RichTextContent data={product.description} className="text-[1.05rem]" />
        </section>
      ) : null}

      {related.docs.length > 0 && (
        <section className="mt-16 md:mt-24" aria-labelledby="related-title">
          <h2 id="related-title" className="mb-7 text-[clamp(1.7rem,3.4vw,2.4rem)] text-primary">
            {dict.product.related}
          </h2>
          <ProductGrid products={related.docs} locale={locale} dict={dict} />
        </section>
      )}

      <JsonLdScript
        data={productLd({
          name: product.name,
          description,
          url,
          images: images.map((i) => new URL(i.url, baseUrl).toString()),
          sku: variants[0]?.sku ?? String(product.id),
          brand: branding.brandName,
          locale,
          category: primaryCat?.name,
          variants: variants.map((v, i) => ({
            sku: v.sku,
            name: `${product.name} — ${v.label}`,
            price: v.price,
            inStock: v.stock > 0,
            saleEndsAt: v.onSale ? (product.variants?.[i]?.saleEndsAt ?? null) : null,
          })),
          ratings: ratings.docs.map((r) => r.rating).filter((r): r is number => typeof r === 'number'),
        })}
      />
    </div>
  )
}

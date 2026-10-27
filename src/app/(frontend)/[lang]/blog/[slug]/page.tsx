import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { ProductGrid } from '@/components/product/ProductCard'
import { RichTextContent } from '@/components/RichTextContent'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { getDictionary } from '@/lib/i18n'
import { formatDate } from '@/lib/i18n/format'
import { articleLd } from '@/lib/seo/jsonld'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { resolveLocale, richTextToPlain, seoFrom } from '@/server/page-helpers'
import { findRedirect, getPostBySlug, getSiteSettings, listProducts, toImage } from '@/server/queries'

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ preview?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const post = await getPostBySlug(locale, slug, (await searchParams).preview === '1')
  if (!post) return {}
  const { branding } = await getSiteSettings(locale)
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt || richTextToPlain(post.content, 300),
    imageUrl: toImage(post.coverImage as never, 'og')?.url,
    seo: seoFrom(post.seo),
    type: 'article',
    noindex: post.status !== 'published',
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function BlogPost({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const dict = getDictionary(locale)
  const post = await getPostBySlug(locale, slug, (await searchParams).preview === '1')
  if (!post) {
    const to = await findRedirect('post', slug)
    if (to) permanentRedirect(`/${locale}/blog/${to}`)
    notFound()
  }
  const cover = toImage(post.coverImage as never, 'large')
  const { branding } = await getSiteSettings(locale)
  const relatedIds = (post.relatedProducts ?? []).map((p) => (typeof p === 'object' ? p.id : p))
  const related = relatedIds.length ? (await listProducts(locale, { ids: relatedIds, limit: 4 })).docs : []
  const baseUrl = env.NEXT_PUBLIC_SERVER_URL
  return (
    <article className="container-page py-8 md:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        baseUrl={baseUrl}
        items={[
          { name: dict.common.home, href: `/${locale}` },
          { name: dict.blog.title, href: `/${locale}/blog` },
          { name: post.title, href: `/${locale}/blog/${post.slug}` },
        ]}
      />
      <header className="mx-auto mt-8 max-w-3xl">
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="text-sm text-ink-soft">
            {formatDate(post.publishedAt, locale)}
            {post.author ? ` · ${post.author}` : ''}
          </time>
        )}
        <h1 className="mt-2 text-[clamp(2.1rem,5vw,3.6rem)] text-primary">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-xl text-ink-soft">{post.excerpt}</p>}
      </header>
      {cover && (
        <div className="relative mx-auto mt-8 aspect-[16/9] max-w-5xl overflow-hidden rounded-[var(--radius-card)] bg-leaf-tint">
          <Image src={cover.url} alt={cover.alt} fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="mx-auto mt-10 max-w-3xl text-[1.08rem]">
        <RichTextContent data={post.content} />
      </div>
      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="post-related">
          <h2 id="post-related" className="mb-6 text-3xl text-primary">
            {dict.product.related}
          </h2>
          <ProductGrid products={related} locale={locale} dict={dict} />
        </section>
      )}
      <JsonLdScript
        data={articleLd({
          headline: post.title,
          description: post.excerpt || richTextToPlain(post.content, 200),
          url: `${baseUrl}/${locale}/blog/${post.slug}`,
          image: cover ? new URL(cover.url, baseUrl).toString() : null,
          datePublished: post.publishedAt || post.createdAt,
          dateModified: post.updatedAt,
          author: post.author,
          publisher: branding.brandName,
          locale,
        })}
      />
    </article>
  )
}

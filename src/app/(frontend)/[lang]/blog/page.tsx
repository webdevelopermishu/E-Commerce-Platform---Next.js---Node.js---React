import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n'
import { formatDate, interpolate } from '@/lib/i18n/format'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { resolveLocale } from '@/server/page-helpers'
import { getSiteSettings, listPosts, toImage } from '@/server/queries'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const page = Math.max(1, Number((await searchParams).page) || 1)
  const dict = getDictionary(locale)
  const { branding } = await getSiteSettings(locale)
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: '/blog',
    title: page > 1 ? `${dict.seo.blogTitle} — ${interpolate(dict.seo.pageSuffix, { page })}` : dict.seo.blogTitle,
    description: dict.blog.intro,
    canonicalQuery: page > 1 ? `?page=${page}` : '',
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function BlogIndex({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const page = Math.max(1, Math.min(200, Number((await searchParams).page) || 1))
  const dict = getDictionary(locale)
  const posts = await listPosts(locale, page)
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="text-[clamp(2.2rem,5vw,3.6rem)] text-primary">{dict.blog.title}</h1>
      <p className="mt-3 max-w-[56ch] text-lg text-ink-soft">{dict.blog.intro}</p>
      {posts.docs.length === 0 ? (
        <p className="mt-12 text-ink-soft">{dict.blog.empty}</p>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.docs.map((p) => {
            const img = toImage(p.coverImage as never, 'card')
            return (
              <li key={p.id}>
                <article>
                  <Link href={`/${locale}/blog/${p.slug}`} className="group block">
                    <span className="relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-leaf-tint">
                      {img && <Image src={img.url} alt={img.alt} fill sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}
                    </span>
                    {p.publishedAt && <time dateTime={p.publishedAt} className="mt-4 block text-sm text-ink-soft">{formatDate(p.publishedAt, locale)}</time>}
                    <h2 className="mt-1 font-display text-2xl text-ink group-hover:text-primary">{p.title}</h2>
                    {p.excerpt && <p className="mt-2 line-clamp-3 text-ink-soft">{p.excerpt}</p>}
                  </Link>
                </article>
              </li>
            )
          })}
        </ul>
      )}
      {posts.totalPages > 1 && (
        <nav aria-label={dict.shop.pagination} className="mt-12 flex justify-center gap-3">
          {posts.hasPrevPage && (
            <Link rel="prev" href={`?page=${page - 1}`} className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-line px-4">
              {dict.shop.previous}
            </Link>
          )}
          {posts.hasNextPage && (
            <Link rel="next" href={`?page=${page + 1}`} className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-line px-4">
              {dict.shop.next}
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { FaqList } from '@/components/home/sections'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { RichTextContent } from '@/components/RichTextContent'
import { getDictionary } from '@/lib/i18n'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { resolveLocale, richTextToPlain, seoFrom } from '@/server/page-helpers'
import { findRedirect, getFaqs, getPageBySlug, getSiteSettings } from '@/server/queries'

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<{ preview?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const page = await getPageBySlug(locale, slug, (await searchParams).preview === '1')
  if (!page) return {}
  const { branding } = await getSiteSettings(locale)
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: `/pages/${page.slug}`,
    title: page.title,
    description: page.intro || richTextToPlain(page.content, 300),
    seo: seoFrom(page.seo),
    noindex: page.status !== 'published',
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function InfoPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const { slug } = await params
  const dict = getDictionary(locale)
  const page = await getPageBySlug(locale, slug, (await searchParams).preview === '1')
  if (!page) {
    const to = await findRedirect('page', slug)
    if (to) permanentRedirect(`/${locale}/pages/${to}`)
    notFound()
  }
  // The FAQ page also lists every published question.
  const faqs = slug === 'faq' ? await getFaqs(locale) : []
  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumbs
        label={dict.common.breadcrumb}
        baseUrl={env.NEXT_PUBLIC_SERVER_URL}
        items={[
          { name: dict.common.home, href: `/${locale}` },
          { name: page.title, href: `/${locale}/pages/${page.slug}` },
        ]}
      />
      <div className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-[clamp(2.1rem,5vw,3.4rem)] text-primary">{page.title}</h1>
        {page.intro && <p className="mt-4 text-xl text-ink-soft">{page.intro}</p>}
        <div className="mt-8 text-[1.05rem]">
          <RichTextContent data={page.content} />
        </div>
      </div>
      {faqs.length > 0 && <FaqList headingId="faq-all" title={dict.home.faq} items={faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />}
    </div>
  )
}

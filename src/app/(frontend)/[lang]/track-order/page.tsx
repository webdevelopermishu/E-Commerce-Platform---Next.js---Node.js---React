import type { Metadata } from 'next'
import { TrackOrderForm } from '@/components/order/TrackOrderForm'
import { getDictionary } from '@/lib/i18n'
import { buildMetadata } from '@/lib/seo/metadata'
import { env } from '@/server/env'
import { resolveLocale } from '@/server/page-helpers'
import { getSiteSettings } from '@/server/queries'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { branding } = await getSiteSettings(locale)
  const dict = getDictionary(locale)
  return buildMetadata({
    baseUrl: env.NEXT_PUBLIC_SERVER_URL,
    locale,
    path: '/track-order',
    title: dict.seo.trackTitle,
    description: dict.order.trackIntro,
    siteName: branding.siteTitle || branding.brandName,
  })
}

export default async function TrackOrderPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const dict = getDictionary(locale)
  return (
    <div className="container-page py-10 md:py-16">
      <h1 className="text-[clamp(2rem,4vw,3rem)] text-primary">{dict.order.trackTitle}</h1>
      <p className="mt-3 max-w-[50ch] text-ink-soft">{dict.order.trackIntro}</p>
      <TrackOrderForm />
    </div>
  )
}

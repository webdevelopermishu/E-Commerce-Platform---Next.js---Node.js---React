import '@fontsource-variable/dm-sans/wght.css'
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/hind-siliguri/400.css'
import '@fontsource/hind-siliguri/500.css'
import '@fontsource/hind-siliguri/600.css'
import '@fontsource/noto-serif-bengali/500.css'
import '@fontsource/noto-serif-bengali/600.css'
import '../globals.css'

import type { Metadata, Viewport } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { Suspense } from 'react'
import { Analytics } from '@/components/analytics/Analytics'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CartProvider } from '@/components/providers/CartProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { WhatsAppButton } from '@/components/whatsapp/WhatsAppButton'
import { getDictionary, localeMeta, locales } from '@/lib/i18n'
import { organizationLd, websiteLd } from '@/lib/seo/jsonld'
import { env } from '@/server/env'
import { mediaUrl } from '@/server/media-url'
import { brandCssVars, resolveLocale } from '@/server/page-helpers'
import { getHomepage, getSiteSettings, toImage } from '@/server/queries'

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  themeColor: '#245B32',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const locale = await resolveLocale(params)
  const { branding, analytics } = await getSiteSettings(locale)
  const siteTitle = branding.siteTitle || branding.brandName
  const favicon = typeof branding.favicon === 'object' && branding.favicon ? mediaUrl(branding.favicon) : null
  const share = typeof branding.defaultShareImage === 'object' ? mediaUrl(branding.defaultShareImage, 'og') : null
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SERVER_URL),
    title: { default: branding.defaultSeoTitle || siteTitle, template: `%s | ${siteTitle}` },
    description: branding.defaultSeoDescription || branding.tagline || undefined,
    applicationName: siteTitle,
    icons: favicon ? { icon: [{ url: favicon }], apple: [{ url: favicon }] } : { icon: [{ url: '/brand/favicon.svg', type: 'image/svg+xml' }] },
    openGraph: { siteName: siteTitle, images: share ? [{ url: share }] : undefined, locale: localeMeta[locale].ogLocale },
    verification: analytics.searchConsoleVerification ? { google: analytics.searchConsoleVerification } : undefined,
    formatDetection: { telephone: false },
  }
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const locale = await resolveLocale(params)
  const dict = getDictionary(locale)
  const [{ branding, contact, navigation, analytics }, homepage] = await Promise.all([getSiteSettings(locale), getHomepage(locale)])

  const brandName = branding.brandName || 'Shop'
  const logo = toImage(branding.logo as never, 'large')
  const logoMobile = toImage(branding.logoMobile as never, 'large')
  const logoFooter = toImage(branding.logoFooter as never, 'large')
  const style = brandCssVars(branding.colors as Record<string, string>) as CSSProperties

  const fallbackColumns = [
    {
      title: dict.footer.shop,
      links: [
        { label: dict.nav.shop, href: '/shop' },
        { label: dict.nav.mangoes, href: '/category/mango' },
      ],
    },
    { title: dict.footer.help, links: [{ label: dict.nav.trackOrder, href: '/track-order' }] },
  ]
  const columns = (navigation.footerColumns ?? []).map((c) => ({ title: c.title, links: (c.links ?? []).map((l) => ({ label: l.label, href: l.href })) }))
  const baseUrl = env.NEXT_PUBLIC_SERVER_URL

  return (
    <html lang={localeMeta[locale].htmlLang} style={style} suppressHydrationWarning>
      <body className="min-h-dvh bg-cream text-ink antialiased">
        <a href="#main" className="sr-only z-[60] rounded bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
          {dict.common.skipToContent}
        </a>
        <I18nProvider locale={locale} dict={dict}>
          <CartProvider>
            {homepage.announcement?.enabled && homepage.announcement.text && (
              <AnnouncementBar text={homepage.announcement.text} href={homepage.announcement.href} tone={homepage.announcement.tone} locale={locale} />
            )}
            <Header
              locale={locale}
              dict={dict}
              brandName={brandName}
              logo={logo}
              mobileLogo={logoMobile}
              links={(navigation.headerLinks ?? []).map((l) => ({ label: l.label, href: l.href }))}
            />
            <main id="main" tabIndex={-1} className="focus:outline-none">
              {children}
            </main>
            <Footer
              locale={locale}
              dict={dict}
              brandName={brandName}
              logo={logoFooter}
              description={navigation.footerDescription || branding.tagline || ''}
              columns={columns.length ? columns : fallbackColumns}
              phone={branding.phone}
              email={branding.email}
              address={branding.address}
              socials={(branding.socials ?? []).map((s) => ({ platform: s.platform, url: s.url }))}
              paymentNote={navigation.paymentNote}
              copyright={navigation.copyright}
            />
            <CartDrawer />
            {contact.whatsappEnabled && contact.whatsappNumber && (
              <Suspense fallback={null}>
                <WhatsAppButton
                  number={contact.whatsappNumber}
                  messageBn={contact.messageBn || ''}
                  messageEn={contact.messageEn || ''}
                  tooltip={contact.tooltip}
                  position={contact.position === 'left' ? 'left' : 'right'}
                  showOn={(contact.showOn as string[] | null) ?? []}
                />
              </Suspense>
            )}
            <Analytics ga4Id={analytics.ga4Id} gtmId={analytics.gtmId} requireConsent={analytics.requireConsent !== false} />
          </CartProvider>
        </I18nProvider>
        <JsonLdScript
          data={[
            organizationLd({
              name: brandName,
              url: baseUrl,
              logoUrl: logo ? new URL(logo.url, baseUrl).toString() : null,
              phone: branding.phone,
              email: branding.email,
              sameAs: (branding.socials ?? []).map((s) => s.url),
            }),
            websiteLd({ name: branding.siteTitle || brandName, url: `${baseUrl}/${locale}`, locale, searchUrl: `${baseUrl}/${locale}/shop` }),
          ]}
        />
      </body>
    </html>
  )
}

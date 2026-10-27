import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import type { Locale } from '@/lib/i18n/config'
import { formatNumber } from '@/lib/i18n/format'
import { isExternal, localizeHref } from '@/lib/links'
import type { ImageData } from '@/server/queries'
import { Logo } from './Logo'

const platformNames: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
}

interface Column {
  title: string
  links: { label: string; href: string }[]
}

export function Footer({
  locale,
  dict,
  brandName,
  logo,
  description,
  columns,
  phone,
  email,
  address,
  socials,
  paymentNote,
  copyright,
}: {
  locale: Locale
  dict: Dictionary
  brandName: string
  logo: ImageData | null
  description: string
  columns: Column[]
  phone?: string | null
  email?: string | null
  address?: string | null
  socials: { platform: string; url: string }[]
  paymentNote?: string | null
  copyright?: string | null
}) {
  const year = formatNumber(new Date().getFullYear(), locale).replace(/,/g, '')
  return (
    <footer className="mt-24 bg-primary-deep text-cream">
      <div className="container-page grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Link href={`/${locale}`} aria-label={brandName} className="inline-block">
            <Logo brandName={brandName} logo={logo} variant="footer" />
          </Link>
          {description && <p className="mt-4 max-w-sm text-[0.95rem] text-cream/80">{description}</p>}
          {socials.length > 0 && (
            <div className="mt-6">
              <h2 className="sr-only">{dict.footer.follow}</h2>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {socials.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cream/90 underline-offset-4 hover:text-accent hover:underline">
                      {platformNames[s.platform] ?? s.platform}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2">
            <h2 className="font-sans text-sm font-semibold text-accent">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-[0.95rem]">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  {isExternal(l.href) ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-cream/85 hover:text-cream hover:underline">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={localizeHref(l.href, locale)} className="text-cream/85 hover:text-cream hover:underline">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-2">
          <h2 className="font-sans text-sm font-semibold text-accent">{dict.footer.contact}</h2>
          <address className="mt-4 space-y-2.5 text-[0.95rem] not-italic text-cream/85">
            {phone && (
              <p>
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="hover:text-cream hover:underline">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p>
                <a href={`mailto:${email}`} className="break-all hover:text-cream hover:underline">
                  {email}
                </a>
              </p>
            )}
            {address && <p className="whitespace-pre-line">{address}</p>}
          </address>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <div className="container-page flex flex-col gap-2 py-5 text-sm text-cream/70 md:flex-row md:items-center md:justify-between">
          <p>{copyright || `© ${year} ${brandName}. ${dict.footer.rights}`}</p>
          {paymentNote && (
            <p>
              <span className="text-cream/90">{dict.footer.payments}:</span> {paymentNote}
            </p>
          )}
        </div>
      </div>
    </footer>
  )
}

'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { locales, localeMeta, switchLocalePath, type Locale } from '@/lib/i18n/config'
import { useI18n } from '../providers/I18nProvider'

/**
 * Keeps the visitor on the same page (same slug, same filters) in the other language.
 * Product, category and post slugs are shared across languages, so the path maps 1:1.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, dict } = useI18n()
  const pathname = usePathname() || `/${locale}`
  const search = useSearchParams()
  const qs = search?.toString()
  return (
    <nav aria-label={dict.common.language} className={`flex items-center rounded-[var(--radius-control)] border border-line p-0.5 text-sm ${className}`}>
      {locales.map((l: Locale) => {
        const active = l === locale
        return (
          <Link
            key={l}
            href={`${switchLocalePath(pathname, l)}${qs ? `?${qs}` : ''}`}
            hrefLang={l}
            lang={l}
            aria-current={active ? 'true' : undefined}
            prefetch={false}
            onClick={() => {
              // Remember the choice immediately (the proxy only records full page loads).
              document.cookie = `site_lang=${l}; path=/; max-age=31536000; samesite=lax`
            }}
            className={`rounded-[6px] px-2.5 py-1 transition-colors ${active ? 'bg-primary text-white' : 'text-ink-soft hover:text-primary'}`}
          >
            {localeMeta[l].label}
          </Link>
        )
      })}
    </nav>
  )
}

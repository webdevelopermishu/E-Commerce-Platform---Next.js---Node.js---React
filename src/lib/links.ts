import type { Locale } from './i18n/config'

/** CMS links are stored without a language prefix ("/shop"). Add the current one; leave external URLs alone. */
export function localizeHref(href: string | null | undefined, locale: Locale): string {
  if (!href) return `/${locale}`
  if (/^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) return href
  if (href === '/') return `/${locale}`
  if (/^\/(bn|en)(\/|$)/.test(href)) return href
  return `/${locale}${href.startsWith('/') ? href : `/${href}`}`
}

export const isExternal = (href: string) => /^https?:\/\//.test(href)

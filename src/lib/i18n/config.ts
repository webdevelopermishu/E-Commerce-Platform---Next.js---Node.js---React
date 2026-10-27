export const locales = ['bn', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'bn'
export const LOCALE_COOKIE = 'site_lang'

export const localeMeta: Record<Locale, { label: string; htmlLang: string; intl: string; ogLocale: string }> = {
  bn: { label: 'বাংলা', htmlLang: 'bn', intl: 'bn-BD', ogLocale: 'bn_BD' },
  en: { label: 'English', htmlLang: 'en', intl: 'en-BD', ogLocale: 'en_US' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/** Swap the locale segment of a pathname, keeping the rest of the path intact. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const parts = pathname.split('/')
  if (isLocale(parts[1])) parts[1] = target
  else parts.splice(1, 0, target)
  const out = parts.join('/')
  return out.endsWith('/') && out.length > 1 ? out.slice(0, -1) : out
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'bn' ? 'en' : 'bn'
}

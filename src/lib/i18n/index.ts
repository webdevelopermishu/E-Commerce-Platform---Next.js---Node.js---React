import bn from './dictionaries/bn'
import en, { type Dictionary } from './dictionaries/en'
import { defaultLocale, isLocale, type Locale } from './config'

export * from './config'
export type { Dictionary }

const dictionaries: Record<Locale, Dictionary> = { bn, en }

export function getDictionary(locale: string): Dictionary {
  return dictionaries[isLocale(locale) ? locale : defaultLocale]
}

/**
 * Pick a localized value from CMS data that was fetched with `locale: 'all'`
 * (shape `{ bn: '...', en: '...' }`) with an explicit fallback to the other language.
 * Returns '' rather than a raw key when both are empty.
 */
export function pickLocalized(value: unknown, locale: Locale): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>
    const primary = rec[locale]
    if (typeof primary === 'string' && primary.trim()) return primary
    const fallback = rec[locale === 'bn' ? 'en' : 'bn']
    if (typeof fallback === 'string') return fallback
  }
  return ''
}

import { localeMeta, type Locale } from './config'

const numberFormatters = new Map<string, Intl.NumberFormat>()

function nf(locale: Locale, fractionDigits: number): Intl.NumberFormat {
  const key = `${locale}:${fractionDigits}`
  let f = numberFormatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(localeMeta[locale].intl, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    numberFormatters.set(key, f)
  }
  return f
}

/** Format integer poisha as "৳ ১,২৫০" (bn) or "৳1,250" (en). Shows decimals only when non-zero. */
export function formatPrice(poisha: number, locale: Locale): string {
  const hasFraction = poisha % 100 !== 0
  // Division only for display; arithmetic never happens on the result.
  const taka = poisha / 100
  const value = nf(locale, hasFraction ? 2 : 0).format(taka)
  return locale === 'bn' ? `৳ ${value}` : `৳${value}`
}

export function formatNumber(value: number, locale: Locale): string {
  return nf(locale, 0).format(value)
}

export function formatDate(value: string | Date, locale: Locale, withTime = false): string {
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(localeMeta[locale].intl, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    timeZone: 'Asia/Dhaka',
  }).format(d)
}

/** Simple `{name}` interpolation for dictionary strings. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}

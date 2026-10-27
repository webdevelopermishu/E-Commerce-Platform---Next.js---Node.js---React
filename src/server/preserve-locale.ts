import type { PayloadRequest } from 'payload'

/**
 * Run a Local API call that needs `req` (to share the DB transaction) but a different locale.
 *
 * Payload's Local API assigns `locale` / `fallbackLocale` onto the req object it receives. Calling, say,
 * `findByID({ locale: 'all', req })` inside a hook would otherwise leave the surrounding save writing to
 * the wrong locale — which silently drops translations. Always wrap such calls with this helper.
 */
export async function withPreservedLocale<T>(req: Partial<PayloadRequest> | undefined, fn: () => Promise<T>): Promise<T> {
  if (!req) return fn()
  const saved = { locale: req.locale, fallbackLocale: req.fallbackLocale }
  try {
    return await fn()
  } finally {
    req.locale = saved.locale
    req.fallbackLocale = saved.fallbackLocale
  }
}

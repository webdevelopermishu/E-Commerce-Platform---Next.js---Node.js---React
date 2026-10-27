import type { PayloadRequest } from 'payload'

/**
 * "Required" for localized fields, enforced only in the default language (বাংলা).
 *
 * Payload's `required: true` on a localized field is checked in every locale, which would stop an editor
 * saving a partial English translation (e.g. just the product name) until every nested label is also
 * translated. Instead: Bangla must be complete; English may be filled in gradually, and the storefront
 * falls back to Bangla for anything not yet translated (tracked by the translation-status column).
 */
export function requiredInDefaultLocale(value: unknown, { req }: { req: PayloadRequest }): true | string {
  const locale = (req?.locale as string | undefined) ?? 'bn'
  if (locale !== 'bn') return true
  const filled = typeof value === 'string' ? value.trim().length > 0 : value != null
  return filled ? true : 'Required in বাংলা (the default language).'
}

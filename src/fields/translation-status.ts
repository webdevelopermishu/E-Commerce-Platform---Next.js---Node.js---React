import type { CollectionBeforeChangeHook, Field } from 'payload'
import { withPreservedLocale } from '../server/preserve-locale'

/**
 * Tracks whether required localized fields are filled in both languages.
 * Stored (non-localized) so it can be shown as a list column and filtered on
 * ("show me everything missing English").
 */
export function translationStatusField(): Field {
  return {
    name: 'translationStatus',
    type: 'select',
    defaultValue: 'missing_en',
    options: [
      { label: 'Complete (বাংলা + English)', value: 'complete' },
      { label: 'Missing English', value: 'missing_en' },
      { label: 'Missing বাংলা', value: 'missing_bn' },
      { label: 'Missing both', value: 'missing_both' },
    ],
    admin: {
      position: 'sidebar',
      readOnly: true,
      description: 'Updated automatically on save. Switch the language at the top of the form to edit each translation.',
    },
  }
}

function filled(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === 'string') return v.trim().length > 0
  if (typeof v === 'object') return JSON.stringify(v).replace(/[{}[\]",:\s]|"text"|"root"/g, '').length > 20
  return true
}

/**
 * `paths` are top-level localized field names to check (e.g. ['name', 'shortDescription']).
 * Reads the stored all-locale document and overlays the locale being saved right now.
 */
export function computeTranslationStatus(paths: string[]): CollectionBeforeChangeHook {
  return async ({ data, req, originalDoc, collection, operation }) => {
    const locale = (req.locale as string) || 'bn'
    let stored: Record<string, unknown> = {}
    if (operation === 'update' && originalDoc?.id) {
      // Must pass `req` (same transaction) without letting locale 'all' leak into the save in progress.
      stored = (await withPreservedLocale(req, () =>
        req.payload.findByID({ collection: collection.slug as 'products', id: originalDoc.id, locale: 'all', depth: 0, req, overrideAccess: true }),
      )) as unknown as Record<string, unknown>
    }
    const has = (lang: 'bn' | 'en') =>
      paths.every((p) => {
        if (lang === locale && p in data) return filled(data[p])
        const v = stored[p] as Record<string, unknown> | undefined
        return filled(v?.[lang])
      })
    const bn = has('bn')
    const en = has('en')
    data.translationStatus = bn && en ? 'complete' : bn ? 'missing_en' : en ? 'missing_bn' : 'missing_both'
    return data
  }
}

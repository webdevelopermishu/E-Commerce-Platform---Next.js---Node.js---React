import type { GroupField } from 'payload'

/**
 * Per-language SEO overrides. Anything left empty falls back to values generated from the content
 * (see src/lib/seo/metadata.ts).
 */
export function seoFields(): GroupField {
  return {
    name: 'seo',
    type: 'group',
    label: 'SEO',
    admin: {
      description: 'Optional. Leave empty to use automatic values generated from the title and description.',
    },
    fields: [
      { name: 'title', type: 'text', localized: true, maxLength: 70, admin: { description: 'Search result title (≈50–60 characters).' } },
      { name: 'description', type: 'textarea', localized: true, maxLength: 200, admin: { description: 'Search result snippet (≈140–160 characters).' } },
      { name: 'focusKeyword', type: 'text', localized: true, admin: { description: 'For your own reference while writing.' } },
      { name: 'ogTitle', label: 'Social share title', type: 'text', localized: true },
      { name: 'ogDescription', label: 'Social share description', type: 'textarea', localized: true },
      { name: 'ogImage', label: 'Social share image', type: 'upload', relationTo: 'media' },
      {
        name: 'canonicalUrl',
        type: 'text',
        admin: { description: 'Only if this content officially lives at another URL. Must be an absolute https:// URL.' },
        validate: (v: string | null | undefined) =>
          !v || /^https:\/\/[^\s]+$/.test(v) ? true : 'Use an absolute https:// URL or leave empty.',
      },
      { name: 'noindex', type: 'checkbox', label: 'Hide from search engines (noindex)', defaultValue: false },
    ],
  }
}

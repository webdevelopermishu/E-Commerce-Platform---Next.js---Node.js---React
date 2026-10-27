import type { TextField } from 'payload'

/** Lowercase ASCII slug. Bangla-only titles produce an empty string, so editors must type a slug then. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Shared (non-localized) URL slug. The same slug is used for /bn/... and /en/... so switching language
 * keeps the visitor on the same product. Auto-generated from the English title when left empty.
 */
export function slugField(fromField = 'name'): TextField {
  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'URL part, e.g. "himsagar-mango". Lowercase letters, numbers and dashes. Changing it creates a redirect from the old URL.',
    },
    validate: (value: string | null | undefined) => {
      if (!value) return 'A slug is required.'
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return 'Use lowercase letters, numbers and single dashes only.'
      return true
    },
    hooks: {
      beforeValidate: [
        ({ value, data, req }) => {
          if (typeof value === 'string' && value.trim()) return slugify(value)
          // Localized source field: try the English value (current locale data or all-locale data).
          const src = data?.[fromField]
          const candidate =
            typeof src === 'string' ? src : src && typeof src === 'object' ? (src.en ?? src[req.locale ?? 'en']) : ''
          return candidate ? slugify(String(candidate)) : value
        },
      ],
      beforeDuplicate: [({ value }) => (value ? `${value}-copy-${Date.now().toString(36)}` : value)],
    },
  }
}

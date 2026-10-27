import crypto from 'crypto'
import path from 'path'
import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '../access'
import { slugify } from '../fields/slug'

/** Local storage directory. Must be a persistent path in production (see docs/DEPLOYMENT.md). */
export const mediaDir = path.resolve(process.env.MEDIA_DIR || path.join(process.cwd(), 'media'))

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Image', plural: 'Media library' },
  admin: { group: 'Content', defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'] },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  hooks: {
    beforeOperation: [
      // Randomize stored filenames so uploads can't collide or be guessed/overwritten.
      ({ req, operation }) => {
        const file = req.file
        if ((operation === 'create' || operation === 'update') && file?.name) {
          const ext = path.extname(file.name).toLowerCase()
          const base = slugify(path.basename(file.name, ext)) || 'image'
          file.name = `${base.slice(0, 40)}-${crypto.randomBytes(5).toString('hex')}${ext}`
        }
      },
    ],
  },
  upload: {
    staticDir: mediaDir,
    mimeTypes: ALLOWED_IMAGE_TYPES,
    focalPoint: true,
    crop: true,
    // Responsive variants generated with sharp (WebP).
    imageSizes: [
      { name: 'thumbnail', width: 240, height: 240, position: 'centre', formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'card', width: 640, height: 640, position: 'centre', formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1400, withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'og', width: 1200, height: 630, position: 'centre', formatOptions: { format: 'jpeg', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      admin: { description: 'Describe the image for screen readers and search engines, in each language.' },
    },
    { name: 'credit', type: 'text', admin: { description: 'Photographer / licence note (internal).' } },
  ],
}

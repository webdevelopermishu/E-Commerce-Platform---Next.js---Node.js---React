import type { Field, GlobalConfig } from 'payload'
import { anyone, isStaff } from '../access'
import { seoFields } from '../fields/seo'
import { requiredInDefaultLocale } from '../fields/localized-required'

const cta = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'label', type: 'text', localized: true, admin: { width: '50%' } },
        { name: 'href', type: 'text', admin: { width: '50%', description: 'e.g. /category/mango' } },
      ],
    },
  ],
})

const enabled = (defaultValue = true): Field => ({ name: 'enabled', type: 'checkbox', defaultValue })

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: { group: 'Content', description: 'Every homepage section, in page order. Hidden sections are skipped.' },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Top',
          fields: [
            {
              name: 'announcement',
              label: 'Announcement bar',
              type: 'group',
              fields: [
                enabled(),
                { name: 'text', type: 'text', localized: true },
                { name: 'href', type: 'text', admin: { description: 'Optional link, e.g. /category/mango' } },
                {
                  name: 'tone',
                  type: 'select',
                  defaultValue: 'green',
                  options: [
                    { label: 'Deep green', value: 'green' },
                    { label: 'Mango yellow', value: 'mango' },
                    { label: 'Cream', value: 'cream' },
                  ],
                },
              ],
            },
            {
              name: 'hero',
              type: 'group',
              fields: [
                { name: 'headline', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale },
                { name: 'subheadline', type: 'textarea', localized: true },
                { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Large mango photograph or artwork. Transparent PNG/WebP cut-outs look best.' } },
                cta('primaryCta', 'Primary button'),
                cta('secondaryCta', 'Secondary button'),
                {
                  name: 'seasonalBadge',
                  type: 'group',
                  fields: [enabled(), { name: 'text', type: 'text', localized: true, admin: { description: 'e.g. "মৌসুম চলছে"' } }],
                },
              ],
            },
            {
              name: 'benefits',
              label: 'Trust benefits',
              type: 'array',
              maxRows: 4,
              admin: { description: 'Up to four short promises you can keep.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'icon',
                      type: 'select',
                      defaultValue: 'leaf',
                      admin: { width: '25%' },
                      options: ['leaf', 'package', 'truck', 'wallet', 'shield', 'phone', 'clock', 'heart'].map((v) => ({ label: v, value: v })),
                    },
                    { name: 'title', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '35%' } },
                    { name: 'text', type: 'text', localized: true, admin: { width: '40%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Products',
          fields: [
            {
              name: 'categoriesSection',
              type: 'group',
              fields: [
                enabled(),
                { name: 'heading', type: 'text', localized: true },
                { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, admin: { description: 'In display order. Empty = featured categories.' } },
              ],
            },
            {
              name: 'featured',
              label: 'Featured mangoes',
              type: 'group',
              fields: [
                enabled(),
                { name: 'heading', type: 'text', localized: true },
                { name: 'intro', type: 'text', localized: true },
                { name: 'category', type: 'relationship', relationTo: 'categories', admin: { description: 'Products come from this category (featured first).' } },
                { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, admin: { description: 'Optional hand-picked list, overrides the category.' } },
                { name: 'limit', type: 'number', defaultValue: 8, min: 2, max: 16 },
                cta('cta', 'Button'),
              ],
            },
            {
              name: 'traditional',
              label: 'Other traditional foods',
              type: 'group',
              fields: [
                enabled(),
                { name: 'heading', type: 'text', localized: true },
                { name: 'intro', type: 'text', localized: true },
                { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, admin: { description: 'Which categories appear, in order.' } },
                { name: 'perCategory', type: 'number', defaultValue: 4, min: 1, max: 8 },
              ],
            },
            {
              name: 'popular',
              label: 'Popular products & bundles',
              type: 'group',
              fields: [
                enabled(),
                { name: 'heading', type: 'text', localized: true },
                { name: 'products', type: 'relationship', relationTo: 'products', hasMany: true, admin: { description: 'Empty = products marked "best seller" and bundles.' } },
              ],
            },
          ],
        },
        {
          label: 'Story & promo',
          fields: [
            {
              name: 'promo',
              label: 'Promotional banner',
              type: 'group',
              fields: [
                enabled(),
                { name: 'heading', type: 'text', localized: true },
                { name: 'text', type: 'textarea', localized: true },
                { name: 'image', type: 'upload', relationTo: 'media' },
                cta('cta', 'Button'),
              ],
            },
            {
              name: 'story',
              label: 'Brand story',
              type: 'group',
              fields: [
                enabled(),
                { name: 'heading', type: 'text', localized: true },
                { name: 'body', type: 'textarea', localized: true, admin: { description: 'Paragraphs separated by a blank line. Only include claims you can stand behind.' } },
                { name: 'image', type: 'upload', relationTo: 'media' },
                cta('cta', 'Button'),
              ],
            },
          ],
        },
        {
          label: 'Reviews & FAQ',
          fields: [
            {
              name: 'testimonials',
              type: 'group',
              fields: [enabled(), { name: 'heading', type: 'text', localized: true }],
              admin: { description: 'Shows approved reviews that customers agreed to publish. Hidden automatically when there are none.' },
            },
            {
              name: 'faq',
              type: 'group',
              fields: [enabled(), { name: 'heading', type: 'text', localized: true }],
            },
          ],
        },
        { label: 'SEO', fields: [seoFields()] },
      ],
    },
  ],
}

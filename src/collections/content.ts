import type { CollectionConfig, Where } from 'payload'
import { anyone, isAdmin, isStaff, publishedOrStaff } from '../access'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { computeTranslationStatus, translationStatusField } from '../fields/translation-status'
import { slugRedirectHook } from '../hooks/slugRedirect'
import { requiredInDefaultLocale } from '../fields/localized-required'

const statusField = (defaultValue: 'published' | 'draft' = 'published') => ({
  name: 'status',
  type: 'select' as const,
  required: true,
  defaultValue,
  index: true,
  options: [
    { label: 'Published', value: 'published' },
    { label: 'Hidden (draft)', value: 'draft' },
  ],
  admin: { position: 'sidebar' as const },
})

export const FAQs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: { group: 'Content', useAsTitle: 'question', defaultColumns: ['question', 'topic', 'showOnHome', 'status', 'translationStatus'] },
  defaultSort: 'sortOrder',
  access: { read: publishedOrStaff, create: isStaff, update: isStaff, delete: isStaff },
  hooks: { beforeChange: [computeTranslationStatus(['question', 'answer'])] },
  fields: [
    { name: 'question', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale },
    { name: 'answer', type: 'textarea', required: true, localized: true, validate: requiredInDefaultLocale },
    {
      name: 'topic',
      type: 'select',
      defaultValue: 'orders',
      options: [
        { label: 'Orders', value: 'orders' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Packaging', value: 'packaging' },
        { label: 'Payment', value: 'payment' },
        { label: 'Availability', value: 'availability' },
        { label: 'Returns', value: 'returns' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'showOnHome', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    statusField(),
    translationStatusField(),
  ],
}

/**
 * Only genuine reviews. New entries default to "pending" and must be approved by staff.
 * The consent checkbox records that the customer agreed to publication.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Customer review', plural: 'Customer reviews' },
  admin: {
    group: 'Content',
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'rating', 'moderation', 'consentToPublish', 'createdAt'],
    description: 'Publish only real reviews from real customers, with their permission.',
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      const where: Where = { and: [{ moderation: { equals: 'approved' } }, { consentToPublish: { equals: true } }] }
      return where
    },
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    { name: 'customerName', type: 'text', required: true },
    { name: 'location', type: 'text', localized: true, admin: { description: 'e.g. "Dhaka" — optional' } },
    { name: 'quote', type: 'textarea', required: true, localized: true, validate: requiredInDefaultLocale, admin: { description: 'Use the customer’s own words. Translate for the other language if needed.' } },
    { name: 'rating', type: 'number', min: 1, max: 5, admin: { description: '1–5, optional. Only enter the rating the customer actually gave.' } },
    { name: 'product', type: 'relationship', relationTo: 'products', admin: { position: 'sidebar' } },
    { name: 'order', type: 'relationship', relationTo: 'orders', admin: { position: 'sidebar', description: 'Verified purchase (optional)' } },
    {
      name: 'moderation',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'consentToPublish', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'The customer agreed to this review being shown.' } },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Where it came from (Facebook comment, WhatsApp, phone call…). Internal.' } },
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog posts' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status', 'translationStatus'],
    preview: (doc, { locale }) => `/${locale || 'bn'}/blog/${doc.slug}?preview=1`,
  },
  defaultSort: '-publishedAt',
  access: { read: publishedOrStaff, create: isStaff, update: isStaff, delete: isStaff },
  hooks: {
    beforeChange: [computeTranslationStatus(['title', 'excerpt'])],
    afterChange: [slugRedirectHook('post')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale },
            { name: 'excerpt', type: 'textarea', localized: true, maxLength: 300 },
            { name: 'coverImage', type: 'upload', relationTo: 'media' },
            { name: 'content', type: 'richText', localized: true },
          ],
        },
        { label: 'SEO', fields: [seoFields()] },
      ],
    },
    slugField('title'),
    statusField('draft'),
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } }, defaultValue: () => new Date().toISOString() },
    { name: 'author', type: 'text', admin: { position: 'sidebar' } },
    { name: 'relatedProducts', type: 'relationship', relationTo: 'products', hasMany: true, admin: { position: 'sidebar' } },
    translationStatusField(),
  ],
}

/** Policies and information pages (delivery, returns, privacy, terms, about, contact). */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages & policies' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'kind', 'status', 'translationStatus'],
    preview: (doc, { locale }) => `/${locale || 'bn'}/pages/${doc.slug}?preview=1`,
  },
  access: { read: publishedOrStaff, create: isStaff, update: isStaff, delete: isStaff },
  hooks: {
    beforeChange: [computeTranslationStatus(['title'])],
    afterChange: [slugRedirectHook('page')],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale },
            { name: 'intro', type: 'textarea', localized: true },
            { name: 'content', type: 'richText', localized: true },
          ],
        },
        { label: 'SEO', fields: [seoFields()] },
      ],
    },
    slugField('title'),
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Information page', value: 'info' },
        { label: 'Policy', value: 'policy' },
      ],
      admin: { position: 'sidebar' },
    },
    statusField(),
    translationStatusField(),
  ],
}

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirect', plural: 'Redirects' },
  admin: {
    group: 'Settings',
    useAsTitle: 'fromSlug',
    defaultColumns: ['type', 'fromSlug', 'toSlug', 'automatic'],
    description: 'Old URLs that permanently redirect to new ones. Created automatically when a slug changes.',
  },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isAdmin },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Product', value: 'product' },
        { label: 'Category', value: 'category' },
        { label: 'Blog post', value: 'post' },
        { label: 'Page', value: 'page' },
      ],
    },
    { name: 'fromSlug', type: 'text', required: true, index: true },
    { name: 'toSlug', type: 'text', required: true },
    { name: 'automatic', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
  ],
}

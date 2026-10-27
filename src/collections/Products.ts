import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'
import { isStaff, publishedOrStaff } from '../access'
import { moneyField } from '../fields/money'
import { seoFields } from '../fields/seo'
import { slugField } from '../fields/slug'
import { computeTranslationStatus, translationStatusField } from '../fields/translation-status'
import { slugRedirectHook } from '../hooks/slugRedirect'
import { effectivePrice } from '../lib/pricing'
import { refreshProductStockAggregates } from '../server/inventory-sql'
import { productsExportEndpoint, productsImportEndpoint } from '../server/admin/products-csv'
import { withPreservedLocale } from '../server/preserve-locale'
import { requiredInDefaultLocale } from '../fields/localized-required'

type VariantInput = {
  id?: string
  sku?: string
  price?: number
  salePrice?: number | null
  saleStartsAt?: string | null
  saleEndsAt?: string | null
}

/** Keep SKUs unique across every variant of every product. */
const validateSkus: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  const variants = (data.variants ?? []) as VariantInput[]
  const skus = variants.map((v) => (v.sku ?? '').trim().toUpperCase()).filter(Boolean)
  const dupInDoc = skus.find((s, i) => skus.indexOf(s) !== i)
  if (dupInDoc) throw new Error(`SKU "${dupInDoc}" is used twice in this product.`)
  variants.forEach((v) => {
    if (v.sku) v.sku = v.sku.trim().toUpperCase()
  })
  if (skus.length) {
    const where: Where = { 'variants.sku': { in: skus } }
    if (originalDoc?.id) where.id = { not_equals: originalDoc.id }
    const clash = await req.payload.find({ collection: 'products', where, limit: 1, depth: 0, req, overrideAccess: true })
    if (clash.docs.length) throw new Error(`One of these SKUs is already used by another product: ${skus.join(', ')}`)
  }
  return data
}

/**
 * Denormalized fields used for sorting/filtering on the shop page:
 * current lowest price, and a search blob containing both languages.
 */
const computeListingFields: CollectionBeforeChangeHook = async ({ data, req, originalDoc, operation }) => {
  const variants = (data.variants ?? []) as VariantInput[]
  const prices = variants
    .filter((v) => typeof v.price === 'number')
    .map((v) => effectivePrice({ price: v.price!, salePrice: v.salePrice, saleStartsAt: v.saleStartsAt, saleEndsAt: v.saleEndsAt }).unitPrice)
  data.minPrice = prices.length ? Math.min(...prices) : 0

  // Search text must include both languages, so read the stored doc with all locales.
  const locale = (req.locale as string) || 'bn'
  let stored: Record<string, Record<string, string> | undefined> = {}
  if (operation === 'update' && originalDoc?.id) {
    stored = (await withPreservedLocale(req, () =>
      req.payload.findByID({ collection: 'products', id: originalDoc.id, locale: 'all', depth: 0, req, overrideAccess: true }),
    )) as never
  }
  const both = (field: string): string[] => {
    const current = typeof data[field] === 'string' ? (data[field] as string) : ''
    const other = locale === 'bn' ? stored[field]?.en : stored[field]?.bn
    return [current, other ?? '']
  }
  data.searchText = [...both('name'), ...both('shortDescription'), ...(data.tags ?? []), ...variants.map((v) => v.sku ?? '')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .slice(0, 4000)
  return data
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'categories', 'minPrice', 'totalStock', 'status', 'featured', 'translationStatus'],
    listSearchableFields: ['name', 'slug', 'searchText'],
    preview: (doc, { locale }) => `/${locale || 'bn'}/product/${doc.slug}?preview=1`,
    components: {
      beforeListTable: ['/components/admin/ProductImportExport#ProductImportExport'],
    },
  },
  defaultSort: 'sortOrder',
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  endpoints: [productsExportEndpoint, productsImportEndpoint],
  hooks: {
    beforeChange: [validateSkus, computeListingFields, computeTranslationStatus(['name', 'shortDescription'])],
    afterChange: [
      slugRedirectHook('product'),
      async ({ doc, req }) => {
        await refreshProductStockAggregates(req.payload, doc.id, req)
        return doc
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Safeguard: products that appear in orders are kept for history — hide them instead.
        const used = await req.payload.find({
          collection: 'orders',
          where: { 'items.product': { equals: id } },
          limit: 1,
          depth: 0,
          req,
          overrideAccess: true,
        })
        if (used.totalDocs > 0) {
          throw new Error('This product appears in existing orders and cannot be deleted. Set its status to "Hidden" instead.')
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'name', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale },
            { name: 'shortDescription', type: 'textarea', localized: true, maxLength: 300, admin: { description: 'One or two sentences for product cards and search results.' } },
            { name: 'description', type: 'richText', localized: true },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'Drag to reorder. The first image is the main image.' },
            },
            {
              name: 'attributes',
              type: 'array',
              labels: { singular: 'Attribute', plural: 'Attributes' },
              admin: { description: 'Facts shown on the product page, e.g. Origin: Rajshahi, Season: June–July.', initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '40%' } },
                    { name: 'value', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '60%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Prices & stock',
          fields: [
            {
              name: 'variants',
              type: 'array',
              minRows: 1,
              required: true,
              labels: { singular: 'Size / pack', plural: 'Sizes / packs' },
              admin: {
                description:
                  'Each size or pack has its own SKU, price and stock. The first one is selected by default. ' +
                  'Stock can be set when a size is created; afterwards change it from Inventory → Stock adjustments so every change is recorded.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', required: true, localized: true, validate: requiredInDefaultLocale, admin: { width: '34%', description: 'e.g. "৫ কেজি" / "5 kg"' } },
                    { name: 'sku', type: 'text', required: true, admin: { width: '22%' } },
                    { name: 'packSize', type: 'number', min: 0, admin: { width: '20%', step: 0.1 } },
                    {
                      name: 'unit',
                      type: 'select',
                      defaultValue: 'kg',
                      admin: { width: '24%' },
                      options: [
                        { label: 'gram (g)', value: 'g' },
                        { label: 'kilogram (kg)', value: 'kg' },
                        { label: 'millilitre (ml)', value: 'ml' },
                        { label: 'litre (l)', value: 'l' },
                        { label: 'piece', value: 'pcs' },
                        { label: 'jar', value: 'jar' },
                        { label: 'box', value: 'box' },
                        { label: 'pack', value: 'pack' },
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    moneyField({ name: 'price', label: 'Regular price (৳)', required: true, admin: { width: '25%' } }),
                    moneyField({ name: 'salePrice', label: 'Sale price (৳)', admin: { width: '25%', description: 'Leave empty for no sale.' } }),
                    { name: 'saleStartsAt', type: 'date', admin: { width: '25%', date: { pickerAppearance: 'dayAndTime' }, description: 'Optional sale start' } },
                    { name: 'saleEndsAt', type: 'date', admin: { width: '25%', date: { pickerAppearance: 'dayAndTime' }, description: 'Optional sale end' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'stock',
                      type: 'number',
                      min: 0,
                      defaultValue: 0,
                      // Editable when the row is first created; afterwards only via stock adjustments / orders,
                      // so an open admin form can never overwrite stock that changed because of a sale.
                      access: { update: () => false },
                      admin: { width: '25%', description: 'Units in stock' },
                    },
                    { name: 'lowStockThreshold', type: 'number', min: 0, defaultValue: 5, admin: { width: '25%' } },
                    { name: 'weightGrams', type: 'number', min: 0, admin: { width: '25%', description: 'Shipping weight (optional)' } },
                  ],
                },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoFields()] },
      ],
    },
    slugField('name'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Hidden (draft)', value: 'draft' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, required: true, admin: { position: 'sidebar' } },
    { name: 'tags', type: 'text', hasMany: true, admin: { position: 'sidebar' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Show in homepage featured sections.' } },
    { name: 'bestSeller', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Show in "Popular picks".' } },
    { name: 'isBundle', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar', description: 'Combo / gift box.' } },
    { name: 'sortOrder', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { position: 'sidebar', description: 'Optional. Otherwise products from the same category are shown.' },
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
    translationStatusField(),
    // ---- System-maintained listing fields ----
    moneyField({ name: 'minPrice', label: 'From price', admin: { readOnly: true, position: 'sidebar', description: 'Calculated' } }),
    { name: 'totalStock', type: 'number', defaultValue: 0, index: true, admin: { readOnly: true, position: 'sidebar', description: 'Calculated from sizes' } },
    { name: 'searchText', type: 'text', index: true, admin: { hidden: true } },
  ],
}

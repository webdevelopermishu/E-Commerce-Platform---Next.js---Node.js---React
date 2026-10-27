import type { CollectionConfig } from 'payload'
import { isManager, nobody } from '../access'
import { applyStockDelta, refreshProductStockAggregates } from '../server/inventory-sql'

/**
 * An append-only stock ledger. Creating an adjustment changes stock atomically (inside the same DB
 * transaction as the ledger row) and records before/after values. Orders and cancellations also write here.
 */
export const StockAdjustments: CollectionConfig = {
  slug: 'stock-adjustments',
  labels: { singular: 'Stock adjustment', plural: 'Stock adjustments' },
  admin: {
    group: 'Inventory',
    useAsTitle: 'sku',
    defaultColumns: ['createdAt', 'sku', 'delta', 'stockBefore', 'stockAfter', 'reason', 'createdBy'],
    description: 'Add a row to receive new stock or correct a count. Use negative numbers to remove stock.',
  },
  defaultSort: '-createdAt',
  access: {
    read: isManager,
    create: isManager,
    update: nobody,
    delete: nobody,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        // Order/cancellation rows are written by the order service, which has already moved the stock.
        if (data.systemGenerated) return data
        const sku = String(data.sku ?? '').trim().toUpperCase()
        const delta = Number(data.delta)
        if (!sku) throw new Error('Enter the SKU of the size/pack to adjust.')
        if (!Number.isInteger(delta) || delta === 0) throw new Error('Change must be a whole number other than 0.')
        const found = await req.payload.find({
          collection: 'products',
          where: { 'variants.sku': { equals: sku } },
          limit: 1,
          depth: 0,
          req,
          overrideAccess: true,
          locale: 'en',
        })
        const product = found.docs[0]
        const variant = product?.variants?.find((v) => v.sku === sku)
        if (!product || !variant?.id) throw new Error(`No product size with SKU "${sku}".`)
        const result = await applyStockDelta(req.payload, { productId: product.id, variantId: variant.id, delta }, req)
        if (!result) throw new Error('Could not update stock for this SKU.')
        data.sku = sku
        data.product = product.id
        data.variantId = variant.id
        data.stockBefore = result.before
        data.stockAfter = result.after
        data.createdBy = (req.user as { email?: string } | null)?.email ?? 'system'
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create' && doc.product) {
          const productId = typeof doc.product === 'object' ? doc.product.id : doc.product
          await refreshProductStockAggregates(req.payload, productId, req)
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'sku', type: 'text', required: true, index: true, admin: { description: 'SKU of the size/pack, e.g. MNG-HIM-5KG' } },
    { name: 'delta', label: 'Change (+/−)', type: 'number', required: true },
    {
      name: 'reason',
      type: 'select',
      required: true,
      defaultValue: 'restock',
      options: [
        { label: 'New stock received', value: 'restock' },
        { label: 'Count correction', value: 'correction' },
        { label: 'Damaged / spoiled', value: 'damage' },
        { label: 'Customer return', value: 'return' },
        { label: 'Order placed (automatic)', value: 'order' },
        { label: 'Order cancelled (automatic)', value: 'order_cancel' },
      ],
    },
    { name: 'note', type: 'textarea' },
    { name: 'product', type: 'relationship', relationTo: 'products', admin: { readOnly: true } },
    { name: 'variantId', type: 'text', admin: { readOnly: true, hidden: true } },
    { name: 'order', type: 'relationship', relationTo: 'orders', admin: { readOnly: true } },
    { name: 'stockBefore', type: 'number', admin: { readOnly: true } },
    { name: 'stockAfter', type: 'number', admin: { readOnly: true } },
    { name: 'createdBy', type: 'text', admin: { readOnly: true } },
    {
      name: 'systemGenerated',
      type: 'checkbox',
      defaultValue: false,
      admin: { hidden: true },
      // Only server code (Local API with overrideAccess) can mark a row as system-generated.
      access: { create: () => false, update: () => false },
    },
  ],
}

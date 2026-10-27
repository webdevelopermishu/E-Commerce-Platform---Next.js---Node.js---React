import type { CollectionBeforeChangeHook, CollectionConfig, FieldAccess } from 'payload'
import { isAdmin, isManager, nobody } from '../access'
import { moneyField } from '../fields/money'
import { districtOptions } from '../lib/bd-locations'
import { restoreOrderStock } from '../server/orders/cancel'
import { ordersCsvEndpoint } from '../server/admin/orders-csv'
import { invoiceEndpoint } from '../server/admin/invoice'

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** Allowed fulfilment transitions. Cancelled and delivered are terminal (delivered → cancelled is not allowed). */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const lockedAfterCreate: FieldAccess = () => false

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const trackStatusChanges: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation !== 'update' || !originalDoc) return data
  const prev = originalDoc.status as OrderStatus
  const next = (data.status ?? prev) as OrderStatus
  const prevPay = originalDoc.paymentStatus as PaymentStatus
  const nextPay = (data.paymentStatus ?? prevPay) as PaymentStatus

  if (next !== prev && !STATUS_TRANSITIONS[prev]?.includes(next)) {
    throw new Error(`An order cannot move from "${titleCase(prev)}" to "${titleCase(next)}".`)
  }
  // statusHistory and stockRestored are system-maintained: always rebuilt from the stored doc,
  // never taken from the request body.
  const history = Array.isArray(originalDoc.statusHistory) ? [...originalDoc.statusHistory] : []
  data.stockRestored = Boolean(originalDoc.stockRestored)
  if (next !== prev || nextPay !== prevPay) {
    history.push({
      status: next,
      paymentStatus: nextPay,
      note: typeof data.statusNote === 'string' && data.statusNote.trim() ? data.statusNote.trim() : undefined,
      at: new Date().toISOString(),
      by: (req.user as { email?: string } | null)?.email ?? 'system',
    })
  }
  data.statusHistory = history
  data.statusNote = ''
  if (next === 'cancelled' && prev !== 'cancelled' && !originalDoc.stockRestored) {
    await restoreOrderStock(req, originalDoc as never)
    data.stockRestored = true
  }
  return data
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Sales',
    defaultColumns: ['orderNumber', 'createdAt', 'customerName', 'customerPhone', 'total', 'status', 'paymentStatus', 'paymentMethod'],
    listSearchableFields: ['orderNumber', 'customerName', 'customerPhone', 'customerEmail'],
    components: {
      beforeListTable: ['/components/admin/OrdersExport#OrdersExport'],
    },
  },
  defaultSort: '-createdAt',
  access: {
    read: isManager,
    update: isManager,
    // Orders are only created by the checkout service (Local API, server side).
    create: nobody,
    delete: isAdmin,
  },
  endpoints: [ordersCsvEndpoint, invoiceEndpoint],
  hooks: {
    beforeChange: [trackStatusChanges],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Order',
          fields: [
            {
              name: 'items',
              type: 'array',
              required: true,
              access: { update: lockedAfterCreate },
              admin: { readOnly: true, description: 'Snapshot of what was bought, at the price paid. Not affected by later product changes.' },
              fields: [
                { name: 'product', type: 'relationship', relationTo: 'products' },
                { name: 'productName', type: 'text', required: true },
                { name: 'productNameEn', type: 'text' },
                { name: 'variantId', type: 'text' },
                { name: 'variantLabel', type: 'text' },
                { name: 'sku', type: 'text' },
                moneyField({ name: 'unitPrice', required: true }),
                moneyField({ name: 'regularPrice' }),
                { name: 'quantity', type: 'number', required: true, min: 1 },
                moneyField({ name: 'lineTotal', required: true }),
              ],
            },
            {
              type: 'row',
              fields: [
                moneyField({ name: 'subtotal', required: true, access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '25%' } }),
                moneyField({ name: 'discount', defaultValue: 0, access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '25%' } }),
                moneyField({ name: 'shippingFee', label: 'Delivery fee', defaultValue: 0, access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '25%' } }),
                moneyField({ name: 'total', required: true, access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '25%' } }),
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'couponCode', type: 'text', access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '33%' } },
                { name: 'deliveryMethod', type: 'text', access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '33%' } },
                { name: 'deliveryZone', type: 'text', access: { update: lockedAfterCreate }, admin: { readOnly: true, width: '33%' } },
              ],
            },
          ],
        },
        {
          label: 'Customer & address',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'customerName', type: 'text', required: true, admin: { width: '34%' } },
                { name: 'customerPhone', type: 'text', required: true, index: true, admin: { width: '33%' } },
                { name: 'customerEmail', type: 'email', admin: { width: '33%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'division', type: 'text', admin: { width: '33%' } },
                { name: 'district', type: 'select', options: districtOptions, admin: { width: '33%' } },
                { name: 'area', type: 'text', admin: { width: '34%' } },
              ],
            },
            { name: 'address', type: 'textarea', required: true },
            { name: 'customerNotes', type: 'textarea', admin: { readOnly: true } },
            { name: 'customer', type: 'relationship', relationTo: 'customers', admin: { readOnly: true } },
          ],
        },
        {
          label: 'History',
          fields: [
            {
              name: 'statusHistory',
              type: 'array',
              admin: { readOnly: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'status', type: 'text', admin: { width: '20%' } },
                    { name: 'paymentStatus', type: 'text', admin: { width: '20%' } },
                    { name: 'at', type: 'date', admin: { width: '30%', date: { pickerAppearance: 'dayAndTime' } } },
                    { name: 'by', type: 'text', admin: { width: '30%' } },
                  ],
                },
                { name: 'note', type: 'text' },
              ],
            },
            {
              name: 'payments',
              type: 'join',
              collection: 'payments',
              on: 'order',
              admin: { defaultColumns: ['provider', 'status', 'amount', 'transactionId', 'createdAt'] },
            },
          ],
        },
      ],
    },
    // ---- Sidebar ----
    { name: 'orderNumber', type: 'text', required: true, unique: true, index: true, access: { update: lockedAfterCreate }, admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'status',
      label: 'Fulfilment status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: ORDER_STATUSES.map((s) => ({ label: titleCase(s), value: s })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      index: true,
      options: PAYMENT_STATUSES.map((s) => ({ label: titleCase(s), value: s })),
      admin: { position: 'sidebar', description: 'Online payments are set automatically after the gateway confirms them server-side.' },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      options: [
        { label: 'Cash on delivery', value: 'cod' },
        { label: 'SSLCommerz', value: 'sslcommerz' },
        { label: 'bKash', value: 'bkash' },
        { label: 'Nagad', value: 'nagad' },
      ],
      access: { update: lockedAfterCreate },
      admin: { position: 'sidebar', readOnly: true },
    },
    { name: 'statusNote', type: 'text', admin: { position: 'sidebar', description: 'Optional note saved into the history with the next status change.' } },
    { name: 'adminNotes', type: 'textarea', admin: { position: 'sidebar', description: 'Internal only.' } },
    { name: 'orderActions', type: 'ui', admin: { position: 'sidebar', components: { Field: '/components/admin/OrderActions#OrderActions' } } },
    { name: 'locale', type: 'select', options: ['bn', 'en'], defaultValue: 'bn', access: { update: lockedAfterCreate }, admin: { position: 'sidebar', readOnly: true } },
    // ---- System fields (never exposed to the storefront) ----
    { name: 'idempotencyKey', type: 'text', unique: true, index: true, access: { read: () => false, update: lockedAfterCreate }, admin: { hidden: true } },
    { name: 'stockRestored', type: 'checkbox', defaultValue: false, admin: { hidden: true } },
  ],
}

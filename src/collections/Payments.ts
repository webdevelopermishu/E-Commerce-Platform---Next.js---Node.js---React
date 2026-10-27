import type { CollectionConfig } from 'payload'
import { isAdmin, isManager, nobody } from '../access'
import { moneyField } from '../fields/money'

/** One row per payment attempt. Written only by the payment service after server-side verification. */
export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: { singular: 'Payment', plural: 'Payments' },
  admin: {
    group: 'Sales',
    useAsTitle: 'reference',
    defaultColumns: ['createdAt', 'order', 'provider', 'amount', 'status', 'transactionId'],
  },
  defaultSort: '-createdAt',
  access: {
    read: isManager,
    create: nobody,
    update: nobody,
    delete: isAdmin,
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'reference', type: 'text', required: true, unique: true, admin: { description: 'Our reference sent to the gateway (tran_id / merchantInvoiceNumber / orderId).' } },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'Cash on delivery', value: 'cod' },
        { label: 'SSLCommerz', value: 'sslcommerz' },
        { label: 'bKash', value: 'bkash' },
        { label: 'Nagad', value: 'nagad' },
      ],
    },
    moneyField({ name: 'amount', required: true }),
    { name: 'currency', type: 'text', defaultValue: 'BDT' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'initiated',
      options: [
        { label: 'Initiated', value: 'initiated' },
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    { name: 'transactionId', type: 'text', index: true, admin: { description: 'Gateway transaction ID (trxID, val_id/bank_tran_id, issuerPaymentRefNo).' } },
    { name: 'gatewayPaymentId', type: 'text', index: true, admin: { description: 'Gateway session/payment ID used for verification.' } },
    { name: 'verifiedAt', type: 'date' },
    { name: 'failureReason', type: 'text' },
    { name: 'gatewayResponse', type: 'json', admin: { description: 'Verification response from the gateway (no credentials are stored).' } },
  ],
}

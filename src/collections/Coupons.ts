import type { CollectionConfig } from 'payload'
import { isManager } from '../access'
import { moneyField } from '../fields/money'
import { normalizeCouponCode } from '../lib/coupons'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: 'Coupon', plural: 'Coupons' },
  admin: {
    group: 'Sales',
    useAsTitle: 'code',
    defaultColumns: ['code', 'active', 'type', 'percent', 'amount', 'usedCount', 'usageLimit', 'endsAt'],
  },
  access: {
    // Coupons are validated server-side only; never readable by the public API.
    read: isManager,
    create: isManager,
    update: isManager,
    delete: isManager,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? normalizeCouponCode(value) : value)] },
      admin: { description: 'Letters and numbers, e.g. MANGO10. Case-insensitive for customers.' },
    },
    { name: 'description', type: 'text', admin: { description: 'Internal note.' } },
    { name: 'active', type: 'checkbox', defaultValue: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'percent',
      options: [
        { label: 'Percentage off', value: 'percent' },
        { label: 'Fixed amount off', value: 'fixed' },
      ],
    },
    {
      name: 'percent',
      type: 'number',
      min: 1,
      max: 100,
      admin: { condition: (_, sib) => sib?.type === 'percent', description: 'e.g. 10 for 10% off' },
      validate: (v: number | null | undefined, { siblingData }: { siblingData: { type?: string } }) =>
        siblingData?.type === 'percent' && (v == null || v <= 0 || v > 100) ? 'Enter a percentage between 1 and 100.' : true,
    },
    moneyField({
      name: 'amount',
      label: 'Amount off (৳)',
      admin: { condition: (_, sib) => sib?.type === 'fixed' },
    }),
    moneyField({ name: 'minSubtotal', label: 'Minimum order subtotal (৳)' }),
    moneyField({ name: 'maxDiscount', label: 'Maximum discount (৳)', admin: { description: 'Cap for percentage coupons (optional).' } }),
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'usageLimit', type: 'number', min: 0, admin: { width: '50%', description: 'Total uses allowed. Empty or 0 = unlimited.' } },
        { name: 'usedCount', type: 'number', defaultValue: 0, admin: { width: '50%', readOnly: true } },
      ],
    },
  ],
}

import type { CollectionConfig } from 'payload'
import { isAdmin, isManager } from '../access'
import { moneyField } from '../fields/money'
import { districtOptions } from '../lib/bd-locations'

/**
 * Customer records are created from checkouts (guest checkout, keyed by mobile number).
 * Only the data needed to deliver orders and provide support is kept.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  admin: {
    group: 'Sales',
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'email', 'orderCount', 'totalSpent', 'lastOrderAt'],
    listSearchableFields: ['name', 'phone', 'email'],
  },
  defaultSort: '-lastOrderAt',
  access: {
    read: isManager,
    create: isManager,
    update: isManager,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true, unique: true, index: true },
    { name: 'email', type: 'email' },
    {
      name: 'lastAddress',
      type: 'group',
      fields: [
        { name: 'division', type: 'text' },
        { name: 'district', type: 'select', options: districtOptions },
        { name: 'area', type: 'text' },
        { name: 'address', type: 'textarea' },
      ],
    },
    { name: 'orderCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    moneyField({ name: 'totalSpent', defaultValue: 0, admin: { readOnly: true, description: 'Sum of order totals (excluding cancelled orders at the time of ordering).' } }),
    { name: 'lastOrderAt', type: 'date', admin: { readOnly: true } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal notes.' } },
    { name: 'orders', type: 'join', collection: 'orders', on: 'customer' },
  ],
}

import type { NumberField } from 'payload'

/**
 * A monetary field stored as integer poisha in PostgreSQL.
 * The admin UI shows and accepts taka (৳) via a custom component, so editors never type poisha.
 */
export function moneyField(overrides: Partial<NumberField> & { name: string }): NumberField {
  const { admin, ...rest } = overrides
  return {
    type: 'number',
    min: 0,
    validate: (value: number | null | undefined, { required }: { required?: boolean }) => {
      if (value == null) return required ? 'This field is required.' : true
      if (!Number.isInteger(value)) return 'Amount must be whole poisha (max 2 decimal places in taka).'
      if (value < 0) return 'Amount cannot be negative.'
      return true
    },
    ...rest,
    admin: {
      ...admin,
      components: {
        Field: '/components/admin/MoneyField#MoneyField',
        Cell: '/components/admin/MoneyCell#MoneyCell',
        ...admin?.components,
      },
    },
  } as NumberField
}

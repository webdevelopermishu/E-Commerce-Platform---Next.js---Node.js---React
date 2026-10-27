import { z } from 'zod'
import { districtCodes, divisionCodes, isDistrictInDivision } from '../bd-locations'
import { normalizeBdPhone } from './phone'

/**
 * Checkout schema shared by the client form (for instant feedback) and the server (authoritative).
 * Error messages are dictionary keys under `checkout.errors` so both languages are supported.
 */
export const cartLineSchema = z.object({
  productId: z.union([z.string().min(1).max(64), z.number().int().positive()]),
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(50),
})

export const checkoutSchema = z
  .object({
    name: z.string().trim().min(2, 'name').max(100, 'name'),
    phone: z
      .string()
      .trim()
      .refine((v) => normalizeBdPhone(v) !== null, 'phone'),
    email: z
      .string()
      .trim()
      .max(200, 'email')
      .refine((v) => v === '' || z.string().email().safeParse(v).success, 'email')
      .optional()
      .default(''),
    division: z.string().refine((v) => divisionCodes.includes(v), 'division'),
    district: z.string().refine((v) => districtCodes.includes(v), 'district'),
    area: z.string().trim().min(2, 'area').max(120, 'area'),
    address: z.string().trim().min(8, 'address').max(400, 'address'),
    notes: z.string().trim().max(500).optional().default(''),
    deliveryMethod: z.string().min(1, 'deliveryMethod').max(40),
    paymentMethod: z.enum(['cod', 'sslcommerz', 'bkash', 'nagad'], { message: 'paymentMethod' }),
  })
  .refine((v) => isDistrictInDivision(v.district, v.division), { path: ['district'], message: 'district' })

export type CheckoutFormValues = z.input<typeof checkoutSchema>
export type CheckoutData = z.output<typeof checkoutSchema>

export const placeOrderSchema = z.object({
  form: checkoutSchema,
  items: z.array(cartLineSchema).min(1).max(40),
  couponCode: z.string().trim().max(40).optional(),
  /** Client-generated UUID; the same key always maps to the same order (double-submit protection). */
  idempotencyKey: z.string().uuid(),
  locale: z.enum(['bn', 'en']),
})

export type PlaceOrderInput = z.input<typeof placeOrderSchema>

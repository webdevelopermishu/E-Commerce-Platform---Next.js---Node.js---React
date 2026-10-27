import { describe, expect, it } from 'vitest'
import { hasRole } from '@/access'
import { getDictionary, pickLocalized } from '@/lib/i18n'
import en from '@/lib/i18n/dictionaries/en'
import bn from '@/lib/i18n/dictionaries/bn'
import { clientIpFromHeaders, rateLimit, resetRateLimits } from '@/lib/rate-limit'
import { checkoutSchema, placeOrderSchema } from '@/lib/validation/checkout'
import { normalizeBdPhone } from '@/lib/validation/phone'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const validForm = {
  name: 'রহিম উদ্দিন',
  phone: '01712345678',
  email: '',
  division: 'dhaka',
  district: 'dhaka',
  area: 'Dhanmondi',
  address: 'House 12, Road 4, Dhanmondi',
  notes: '',
  deliveryMethod: 'standard',
  paymentMethod: 'cod' as const,
}

describe('Bangladesh phone numbers', () => {
  it('accepts common formats including Bengali digits', () => {
    for (const p of ['01712345678', '+8801712345678', '8801712345678', '017-1234-5678', '০১৭১২৩৪৫৬৭৮']) expect(normalizeBdPhone(p)).toBe('01712345678')
  })
  it('rejects non-mobile or malformed numbers', () => {
    for (const p of ['01212345678', '0171234567', '017123456789', '1712345678', 'abc']) expect(normalizeBdPhone(p)).toBeNull()
  })
})

describe('checkout validation', () => {
  it('accepts a complete form', () => expect(checkoutSchema.safeParse(validForm).success).toBe(true))
  it('returns dictionary keys as messages for each invalid field', () => {
    const r = checkoutSchema.safeParse({ ...validForm, name: 'A', phone: '123', email: 'nope', address: 'short' })
    expect(r.success).toBe(false)
    const msgs = Object.fromEntries(r.error!.issues.map((i) => [String(i.path[0]), i.message]))
    expect(msgs).toMatchObject({ name: 'name', phone: 'phone', email: 'email', address: 'address' })
  })
  it('rejects a district outside the chosen division', () => {
    const r = checkoutSchema.safeParse({ ...validForm, division: 'rajshahi', district: 'dhaka' })
    expect(r.success).toBe(false)
  })
  it('rejects unknown payment methods and malformed cart payloads', () => {
    expect(checkoutSchema.safeParse({ ...validForm, paymentMethod: 'paypal' }).success).toBe(false)
    const base = { form: validForm, idempotencyKey: '7b0b3a1e-4b7a-4c1e-9a55-3b2f0c9d1e11', locale: 'bn' }
    expect(placeOrderSchema.safeParse({ ...base, items: [] }).success).toBe(false)
    expect(placeOrderSchema.safeParse({ ...base, items: [{ productId: 1, variantId: 'a', quantity: 0 }] }).success).toBe(false)
    expect(placeOrderSchema.safeParse({ ...base, idempotencyKey: 'x', items: [{ productId: 1, variantId: 'a', quantity: 1 }] }).success).toBe(false)
    // A browser-supplied price is simply not part of the schema and is stripped.
    const ok = placeOrderSchema.parse({ ...base, items: [{ productId: 1, variantId: 'a', quantity: 1, price: 1 } as never] })
    expect('price' in ok.items[0]!).toBe(false)
  })
})

describe('translations', () => {
  it('has the same keys in Bangla and English (no missing or untranslated UI strings)', () => {
    const keys = (o: unknown, p = ''): string[] =>
      o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k)) : [p]
    expect(keys(bn).sort()).toEqual(keys(en).sort())
    const empties = (o: unknown, p = ''): string[] =>
      o && typeof o === 'object' ? Object.entries(o).flatMap(([k, v]) => empties(v, `${p}.${k}`)) : typeof o === 'string' && !o.trim() ? [p] : []
    expect(empties(bn)).toEqual([])
    expect(empties(en)).toEqual([])
  })
  it('falls back to the default language dictionary for unknown locales', () => {
    expect(getDictionary('fr')).toBe(getDictionary('bn'))
  })
  it('picks a localized CMS value with fallback to the other language, never a raw key', () => {
    expect(pickLocalized({ bn: 'আম', en: 'Mango' }, 'en')).toBe('Mango')
    expect(pickLocalized({ bn: 'আম', en: '' }, 'en')).toBe('আম')
    expect(pickLocalized({ bn: '', en: 'Mango' }, 'bn')).toBe('Mango')
    expect(pickLocalized(undefined, 'bn')).toBe('')
  })
})

describe('WhatsApp link', () => {
  it('builds a wa.me URL with digits only and an encoded message', () => {
    expect(buildWhatsAppUrl('+880 1712-345678', 'আসসালামু আলাইকুম! দাম কত?')).toBe(
      `https://wa.me/8801712345678?text=${encodeURIComponent('আসসালামু আলাইকুম! দাম কত?')}`,
    )
  })
  it('returns null for a missing or invalid number so the button is hidden', () => {
    expect(buildWhatsAppUrl('', 'hi')).toBeNull()
    expect(buildWhatsAppUrl('123', 'hi')).toBeNull()
  })
})

describe('permissions', () => {
  it('recognizes staff roles only on the users collection', () => {
    expect(hasRole({ collection: 'users', roles: ['manager'] }, 'admin', 'manager')).toBe(true)
    expect(hasRole({ collection: 'users', roles: ['editor'] }, 'admin', 'manager')).toBe(false)
    // A customer account claiming a role must never be treated as staff.
    expect(hasRole({ collection: 'customers', roles: ['admin'] }, 'admin')).toBe(false)
    expect(hasRole(null, 'admin')).toBe(false)
  })
})

describe('rate limiting', () => {
  it('blocks after the limit within the window and resets afterwards', () => {
    resetRateLimits()
    const t = 1_000_000
    for (let i = 0; i < 3; i++) expect(rateLimit('k', 3, 60_000, t).ok).toBe(true)
    const blocked = rateLimit('k', 3, 60_000, t + 1000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfterSeconds).toBe(59)
    expect(rateLimit('k', 3, 60_000, t + 61_000).ok).toBe(true)
  })
  it('uses the proxy-set address, not a client-forged X-Forwarded-For', () => {
    expect(clientIpFromHeaders(new Headers({ 'x-real-ip': '203.0.113.9', 'x-forwarded-for': '1.1.1.1' }))).toBe('203.0.113.9')
    expect(clientIpFromHeaders(new Headers({ 'x-forwarded-for': '1.1.1.1, 203.0.113.9' }))).toBe('203.0.113.9')
  })
})

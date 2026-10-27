import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'
import { freshPayload, seedMinimalStore } from './helpers'

let payload: Payload
let productId: number

beforeAll(async () => {
  payload = await freshPayload()
  const s = await seedMinimalStore(payload)
  productId = s.product.id
})

describe('access control (public API, overrideAccess: false)', () => {
  const asPublic = { overrideAccess: false } as const

  it('anonymous visitors see only published products', async () => {
    const res = await payload.find({ collection: 'products', ...asPublic, depth: 0 })
    expect(res.docs.map((d) => d.slug)).toEqual(['himsagar'])
  })

  it('anonymous visitors cannot read orders or customers', async () => {
    await expect(payload.find({ collection: 'orders', ...asPublic })).rejects.toThrow()
    await expect(payload.find({ collection: 'customers', ...asPublic })).rejects.toThrow()
  })

  it('anonymous visitors cannot change prices, stock or settings', async () => {
    await expect(payload.update({ collection: 'products', id: productId, data: { slug: 'hacked' }, ...asPublic })).rejects.toThrow()
    await expect(payload.updateGlobal({ slug: 'payment-settings', data: { codEnabled: false }, ...asPublic })).rejects.toThrow()
  })

  it('nobody can create a staff account without being signed in as an admin', async () => {
    await expect(
      payload.create({ collection: 'users', data: { email: 'x@example.test', password: 'long-enough-password', roles: ['admin'] }, ...asPublic }),
    ).rejects.toThrow()
    await expect(
      payload.create({ collection: 'users', data: { email: 'y@example.test', password: 'long-enough-password', roles: ['admin'] }, overrideAccess: true }),
    ).rejects.toThrow()
  })

  it('an editor can edit the catalog but cannot read orders or manage users', async () => {
    const editor = await payload.create({
      collection: 'users',
      data: { email: 'editor@example.test', password: 'long-enough-password', roles: ['editor'] },
      overrideAccess: true,
      context: { allowStaffBootstrap: true },
    })
    const user = { ...editor, collection: 'users' as const }
    await expect(payload.update({ collection: 'products', id: productId, data: { featured: true }, user, overrideAccess: false })).resolves.toBeTruthy()
    await expect(payload.find({ collection: 'orders', user, overrideAccess: false })).rejects.toThrow()
    await expect(payload.create({ collection: 'users', data: { email: 'z@example.test', password: 'long-enough-password', roles: ['editor'] }, user, overrideAccess: false })).rejects.toThrow()
  })
})

describe('translations', () => {
  it('stores Bangla and English independently and tracks completeness', async () => {
    const before = await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true })
    expect(before.translationStatus).toBe('missing_en')
    await payload.update({ collection: 'products', id: productId, locale: 'en', data: { name: 'Himsagar Mango', shortDescription: 'Sweet mango' }, overrideAccess: true })
    const bn = await payload.findByID({ collection: 'products', id: productId, locale: 'bn', depth: 0, overrideAccess: true })
    const en = await payload.findByID({ collection: 'products', id: productId, locale: 'en', depth: 0, overrideAccess: true })
    expect(bn.name).toBe('হিমসাগর আম')
    expect(en.name).toBe('Himsagar Mango')
    expect(en.translationStatus).toBe('complete')
  })

  it('still requires the Bangla (default-language) name', async () => {
    await expect(
      payload.create({ collection: 'categories', locale: 'bn', data: { name: '', slug: 'empty-name', status: 'published' }, overrideAccess: true }),
    ).rejects.toThrow()
  })

  it('falls back to Bangla when an English translation is missing', async () => {
    const cat = await payload.create({ collection: 'categories', locale: 'bn', data: { name: 'ঘি', slug: 'ghee', status: 'published' } })
    const en = await payload.findByID({ collection: 'categories', id: cat.id, locale: 'en', overrideAccess: true })
    expect(en.name).toBe('ঘি')
  })

  it('keeps an old product URL working by creating a redirect when the slug changes', async () => {
    await payload.update({ collection: 'products', id: productId, data: { slug: 'himsagar-mango' }, overrideAccess: true })
    const r = await payload.find({ collection: 'redirects', overrideAccess: true, depth: 0 })
    expect(JSON.stringify(r.docs)).toContain('himsagar')
  })
})

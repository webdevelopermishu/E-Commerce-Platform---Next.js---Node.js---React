import { describe, expect, it } from 'vitest'
import { breadcrumbLd, productLd } from '@/lib/seo/jsonld'
import { buildMetadata, truncate } from '@/lib/seo/metadata'

const base = { baseUrl: 'https://shop.example', siteName: 'Shop' }

describe('metadata', () => {
  it('generates canonical and hreflang alternates for both languages', () => {
    const m = buildMetadata({ ...base, locale: 'en', path: '/product/himsagar', title: 'Himsagar Mango', description: 'Sweet' })
    expect(m.alternates?.canonical).toBe('https://shop.example/en/product/himsagar')
    expect(m.alternates?.languages).toMatchObject({
      bn: 'https://shop.example/bn/product/himsagar',
      en: 'https://shop.example/en/product/himsagar',
      'x-default': 'https://shop.example/bn/product/himsagar',
    })
  })
  it('lets admin SEO overrides win and supports noindex', () => {
    const m = buildMetadata({
      ...base,
      locale: 'bn',
      path: '/category/mango',
      title: 'আম',
      seo: { title: 'কাস্টম শিরোনাম', description: 'কাস্টম বিবরণ', noindex: true, canonicalUrl: 'https://shop.example/bn/category/mango' },
    })
    expect(JSON.stringify(m.title)).toContain('কাস্টম শিরোনাম')
    expect(m.description).toBe('কাস্টম বিবরণ')
    expect(m.robots).toMatchObject({ index: false })
  })
  it('turns relative image paths into absolute URLs', () => {
    const m = buildMetadata({ ...base, locale: 'en', path: '', title: 'Home', imageUrl: '/api/media/file/a.webp' })
    expect(JSON.stringify(m.openGraph)).toContain('https://shop.example/api/media/file/a.webp')
  })
  it('truncates descriptions on a word boundary', () => {
    const t = truncate('word '.repeat(60), 50)
    expect(t.length).toBeLessThanOrEqual(50)
    expect(t.endsWith('…')).toBe(true)
  })
})

describe('structured data', () => {
  it('reflects the real price and stock and never invents ratings', () => {
    const ld = JSON.stringify(
      productLd({
        name: 'Himsagar Mango',
        description: 'Sweet',
        url: 'https://shop.example/en/product/himsagar',
        images: ['https://shop.example/a.webp'],
        sku: 'H-5',
        brand: 'Shop',
        locale: 'en',
        variants: [{ sku: 'H-5', name: '5 kg', price: 85000, inStock: false }],
      }),
    )
    expect(ld).toContain('"price":"850.00"')
    expect(ld).toContain('OutOfStock')
    expect(ld).not.toContain('aggregateRating')
  })
  it('builds breadcrumbs in order', () => {
    const ld = breadcrumbLd([
      { name: 'Home', url: 'https://shop.example/en' },
      { name: 'Mangoes', url: 'https://shop.example/en/category/mango' },
    ]) as { itemListElement: { position: number; name: string }[] }
    expect(ld.itemListElement.map((i) => [i.position, i.name])).toEqual([
      [1, 'Home'],
      [2, 'Mangoes'],
    ])
  })
})

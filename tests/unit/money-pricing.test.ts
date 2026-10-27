import { describe, expect, it } from 'vitest'
import { multiply, percentOf, poishaToTakaString, sum, takaToPoisha } from '@/lib/money'
import { effectivePrice, isSaleActive } from '@/lib/pricing'

describe('money (integer poisha)', () => {
  it('converts taka input to poisha without float drift', () => {
    expect(takaToPoisha('450')).toBe(45000)
    expect(takaToPoisha('450.5')).toBe(45050)
    expect(takaToPoisha('1,250.75')).toBe(125075)
    expect(takaToPoisha(0.1 + 0.2 === 0.3 ? '0.3' : '0.30')).toBe(30)
    expect(() => takaToPoisha('12.345')).toThrow()
    expect(() => takaToPoisha('abc')).toThrow()
  })
  it('formats poisha back to taka', () => {
    expect(poishaToTakaString(45000)).toBe('450')
    expect(poishaToTakaString(45050)).toBe('450.50')
    expect(poishaToTakaString(5)).toBe('0.05')
  })
  it('rejects non-integer amounts in arithmetic', () => {
    expect(() => multiply(10.5, 2)).toThrow()
    expect(() => multiply(100, 1.5)).toThrow()
    expect(() => sum([100, 0.1])).toThrow()
    expect(multiply(85000, 3)).toBe(255000)
  })
  it('rounds percentages half-up to the poisha', () => {
    expect(percentOf(10000, 10)).toBe(1000)
    expect(percentOf(333, 10)).toBe(33) // 33.3
    expect(percentOf(335, 10)).toBe(34) // 33.5 → 34
    expect(() => percentOf(100, 101)).toThrow()
  })
})

describe('variant pricing and sale scheduling', () => {
  const now = new Date('2026-06-01T00:00:00Z')
  it('uses the regular price when there is no sale', () => {
    expect(effectivePrice({ price: 90000 }, now)).toEqual({ unitPrice: 90000, regularPrice: 90000, onSale: false, discountPercent: 0 })
  })
  it('applies an active sale and never overstates the discount badge', () => {
    const p = effectivePrice({ price: 170000, salePrice: 160000 }, now)
    expect(p.unitPrice).toBe(160000)
    expect(p.onSale).toBe(true)
    expect(p.discountPercent).toBe(5) // 5.88% rounds DOWN
  })
  it('ignores a sale outside its schedule window', () => {
    expect(isSaleActive({ price: 1000, salePrice: 800, saleStartsAt: '2026-07-01T00:00:00Z' }, now)).toBe(false)
    expect(isSaleActive({ price: 1000, salePrice: 800, saleEndsAt: '2026-05-01T00:00:00Z' }, now)).toBe(false)
    expect(isSaleActive({ price: 1000, salePrice: 800, saleStartsAt: '2026-05-01T00:00:00Z', saleEndsAt: '2026-07-01T00:00:00Z' }, now)).toBe(true)
  })
  it('ignores a "sale" that is not cheaper than the regular price', () => {
    expect(isSaleActive({ price: 1000, salePrice: 1000 }, now)).toBe(false)
    expect(isSaleActive({ price: 1000, salePrice: 1200 }, now)).toBe(false)
    expect(isSaleActive({ price: 1000, salePrice: 0 }, now)).toBe(false)
  })
})

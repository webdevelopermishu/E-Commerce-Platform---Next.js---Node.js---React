import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from '@/proxy'

const req = (path: string, headers: Record<string, string> = {}) => new NextRequest(new URL(path, 'https://shop.example'), { headers })

describe('locale proxy', () => {
  it('redirects new visitors from / to Bangla, keeping the query string', () => {
    const res = proxy(req('/?utm=x'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://shop.example/bn?utm=x')
  })
  it('redirects to the saved language', () => {
    const res = proxy(req('/shop', { cookie: 'site_lang=en' }))
    expect(res.headers.get('location')).toBe('https://shop.example/en/shop')
  })
  it('remembers the language of a real page load', () => {
    const res = proxy(req('/en/shop', { cookie: 'site_lang=bn', 'sec-fetch-dest': 'document' }))
    expect(res.headers.get('set-cookie')).toMatch(/site_lang=en/)
    const legacy = proxy(req('/en/shop', { cookie: 'site_lang=bn', accept: 'text/html,application/xhtml+xml' }))
    expect(legacy.headers.get('set-cookie')).toMatch(/site_lang=en/)
  })
  it('does not record the language on client-side (RSC) navigations or prefetches', () => {
    // Router fetches/prefetches are `fetch()` calls: Sec-Fetch-Dest is "empty" and Accept is not text/html.
    expect(proxy(req('/en/shop', { cookie: 'site_lang=bn', 'sec-fetch-dest': 'empty', accept: '*/*' })).headers.get('set-cookie')).toBeNull()
    expect(proxy(req('/en/shop', { cookie: 'site_lang=bn', accept: '*/*' })).headers.get('set-cookie')).toBeNull()
  })
  it('does not let a background prefetch overwrite the saved language', () => {
    const prefetches: Record<string, string>[] = [{ 'sec-fetch-dest': 'empty', 'next-router-prefetch': '1' }, { 'sec-fetch-dest': 'empty', 'sec-purpose': 'prefetch' }]
    for (const h of prefetches) {
      const res = proxy(req('/en/shop', { cookie: 'site_lang=bn', ...h }))
      expect(res.headers.get('set-cookie')).toBeNull()
    }
  })
})

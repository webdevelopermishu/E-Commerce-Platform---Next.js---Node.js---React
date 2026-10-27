import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['bn', 'en']
const DEFAULT = 'bn'
const COOKIE = 'site_lang'

/**
 * Locale routing:
 *  - /bn/... and /en/... pass through and remember the choice in a cookie.
 *  - Any other storefront path redirects to the visitor's saved language, or Bangla for new visitors.
 * Admin, API, media, payment callbacks, SEO files and static assets are excluded via `matcher`.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const first = pathname.split('/')[1] ?? ''

  if (LOCALES.includes(first)) {
    const res = NextResponse.next()
    // Only a full page load records the preference. Client-side router fetches — including background
    // prefetches of links, which can finish after the visitor switched language — must never touch it; the
    // language switcher writes the cookie itself when clicked. Next strips its RSC headers and `_rsc` before the
    // proxy runs, so use the browser's Sec-Fetch-Dest (document vs. empty) or, for old clients, the Accept header.
    const dest = request.headers.get('sec-fetch-dest')
    const isPageLoad = dest ? dest === 'document' : (request.headers.get('accept') ?? '').includes('text/html')
    if (isPageLoad && request.cookies.get(COOKIE)?.value !== first) {
      res.cookies.set(COOKIE, first, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
    }
    return res
  }

  const saved = request.cookies.get(COOKIE)?.value
  const locale = saved && LOCALES.includes(saved) ? saved : DEFAULT
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  url.search = search
  return NextResponse.redirect(url, 307)
}

export const config = {
  matcher: [
    '/((?!api|admin|_next|payments|healthz|media|brand|fonts|favicon\\.ico|icon|apple-icon|robots\\.txt|sitemap.*\\.xml|manifest\\.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|txt|xml|js|css|woff2?)$).*)',
  ],
}

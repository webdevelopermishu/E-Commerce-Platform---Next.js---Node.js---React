import type { MetadataRoute } from 'next'
import { env } from '@/server/env'

export const dynamic = 'force-dynamic'

/**
 * Private and transactional routes are excluded. CSS/JS (/_next) and media remain crawlable so pages render
 * correctly for search engines. Set ROBOTS_DISALLOW_ALL=true on staging servers.
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SERVER_URL
  if (process.env.ROBOTS_DISALLOW_ALL === 'true') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/payments/', '/*/cart', '/*/checkout', '/*/order/', '/*?*preview=1'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}

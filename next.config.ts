import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/**
 * Remote media hosts (e.g. an S3/R2/Spaces public URL or CDN) must be allowed for next/image.
 * Set MEDIA_PUBLIC_HOSTNAMES to a comma-separated list of hostnames in production when using S3.
 */
const remoteHosts = (process.env.MEDIA_PUBLIC_HOSTNAMES || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  // Uploaded media lives outside the build (persistent dir or S3); never bundle it into the standalone output.
  outputFileTracingExcludes: { '*': ['media/**', 'test-results/**', 'playwright-report/**', 'docs/**'] },
  poweredByHeader: false,
  agentRules: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    localPatterns: [{ pathname: '/api/media/file/**' }, { pathname: '/brand/**' }],
    remotePatterns: remoteHosts.map((hostname) => ({ protocol: 'https' as const, hostname })),
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Uploaded SVGs are served from our own origin: forbid scripts/plugins in them so a malicious upload
      // can never run code with a visitor's or an admin's session.
      {
        source: '/api/media/file/:file*',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      // Admin, CMS API, private order pages and payment callbacks must never appear in search results.
      ...['/admin/:path*', '/api/:path*', '/:lang/order/:path*', '/payments/:path*'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

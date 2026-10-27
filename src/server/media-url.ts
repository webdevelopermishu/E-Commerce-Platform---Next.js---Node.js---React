import type { Media } from '../payload-types'

type Size = 'thumbnail' | 'card' | 'large' | 'og'

/** Best URL for a media doc at a given size, falling back to the original. Returns a path or absolute URL. */
export function mediaUrl(media: Media | number | null | undefined, size?: Size): string | null {
  if (!media || typeof media !== 'object') return null
  const sized = size ? media.sizes?.[size]?.url : null
  const url = sized || media.url || null
  return url ? toLocalPath(url) : null
}

/**
 * Payload prefixes local-storage URLs with serverURL. Turning our own origin back into a path keeps next/image on
 * its `localPatterns` (no self-fetch over the public internet) and makes the site work behind any host name.
 * URLs on other hosts (S3/CDN) are returned unchanged.
 */
function toLocalPath(url: string): string {
  const m = /^https?:\/\/[^/]+(\/api\/media\/file\/.*)$/.exec(url)
  return m ? m[1]! : url
}

export function mediaDims(media: Media | number | null | undefined, size?: Size): { width: number; height: number } | null {
  if (!media || typeof media !== 'object') return null
  const s = size ? media.sizes?.[size] : null
  const width = s?.width ?? media.width
  const height = s?.height ?? media.height
  return width && height ? { width, height } : null
}

export function absoluteUrl(pathOrUrl: string, base: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${base.replace(/\/$/, '')}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

import type { Metadata } from 'next'
import { localeMeta, locales, type Locale } from '../i18n/config'

export interface SeoOverrides {
  title?: string | null
  description?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  canonicalUrl?: string | null
  noindex?: boolean | null
}

export interface MetaInput {
  baseUrl: string
  locale: Locale
  /** Path WITHOUT the locale prefix, e.g. "/product/himsagar" ("" for home). */
  path: string
  title: string
  description?: string | null
  imageUrl?: string | null
  seo?: SeoOverrides | null
  type?: 'website' | 'article'
  /** Extra query string kept in the canonical (e.g. "?page=2"). */
  canonicalQuery?: string
  noindex?: boolean
  /** When false, no hreflang alternates are emitted (e.g. content missing in the other language). */
  alternates?: boolean
  siteName: string
}

export function localizedUrl(baseUrl: string, locale: Locale, path: string, query = ''): string {
  return `${baseUrl.replace(/\/$/, '')}/${locale}${path}${query}`
}

/** Plain text trimmed to a sentence-ish boundary for meta descriptions. */
export function truncate(text: string | null | undefined, max = 160): string {
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const at = Math.max(cut.lastIndexOf('। '), cut.lastIndexOf('. '), cut.lastIndexOf(' '))
  return `${cut.slice(0, at > max * 0.6 ? at : cut.length).trim()}…`
}

const abs = (base: string, u?: string | null) => (u ? (/^https?:\/\//.test(u) ? u : `${base.replace(/\/$/, '')}${u.startsWith('/') ? '' : '/'}${u}`) : undefined)

/**
 * Build Next.js Metadata for a localized page. Admin SEO overrides win over generated values.
 * Canonical points at the same-language URL; hreflang links both languages plus x-default (Bangla).
 */
export function buildMetadata(i: MetaInput): Metadata {
  const title = i.seo?.title?.trim() || i.title
  const description = truncate(i.seo?.description?.trim() || i.description || '')
  const canonical = i.seo?.canonicalUrl?.trim() || localizedUrl(i.baseUrl, i.locale, i.path, i.canonicalQuery ?? '')
  const image = abs(i.baseUrl, i.seo?.ogImageUrl || i.imageUrl)
  const noindex = Boolean(i.noindex || i.seo?.noindex)
  const languages: Record<string, string> = {}
  if (i.alternates !== false) {
    for (const l of locales) languages[l] = localizedUrl(i.baseUrl, l, i.path, i.canonicalQuery ?? '')
    languages['x-default'] = localizedUrl(i.baseUrl, 'bn', i.path, i.canonicalQuery ?? '')
  }
  return {
    title,
    description: description || undefined,
    alternates: { canonical, languages: i.alternates === false ? undefined : languages },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: i.type ?? 'website',
      url: canonical,
      siteName: i.siteName,
      title: i.seo?.ogTitle?.trim() || title,
      description: i.seo?.ogDescription?.trim() || description || undefined,
      locale: localeMeta[i.locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== i.locale).map((l) => localeMeta[l].ogLocale),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: i.seo?.ogTitle?.trim() || title,
      description: i.seo?.ogDescription?.trim() || description || undefined,
      images: image ? [image] : undefined,
    },
  }
}

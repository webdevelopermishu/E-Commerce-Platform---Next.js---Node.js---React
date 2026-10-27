import 'server-only'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '../lib/i18n/config'
import type { SeoOverrides } from '../lib/seo/metadata'
import type { Media } from '../payload-types'
import { mediaUrl } from './media-url'

export async function resolveLocale(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return lang
}

type SeoGroup = {
  title?: string | null
  description?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImage?: number | Media | null
  canonicalUrl?: string | null
  noindex?: boolean | null
} | null | undefined

export function seoFrom(seo: SeoGroup): SeoOverrides {
  return {
    title: seo?.title,
    description: seo?.description,
    ogTitle: seo?.ogTitle,
    ogDescription: seo?.ogDescription,
    ogImageUrl: typeof seo?.ogImage === 'object' ? mediaUrl(seo.ogImage, 'og') : null,
    canonicalUrl: seo?.canonicalUrl,
    noindex: seo?.noindex,
  }
}

/** Extract plain text from Lexical rich text (for meta descriptions and JSON-LD). */
export function richTextToPlain(value: unknown, max = 5000): string {
  const out: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object' || out.join(' ').length > max) return
    const n = node as { text?: string; children?: unknown[]; root?: unknown }
    if (typeof n.text === 'string') out.push(n.text)
    if (n.root) walk(n.root)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  walk(value)
  return out.join(' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

const HEX = /^#[0-9a-fA-F]{6}$/
export function brandCssVars(colors: Record<string, string | null | undefined> | null | undefined): Record<string, string> {
  const map: Record<string, string> = {
    primary: '--brand-primary',
    secondary: '--brand-secondary',
    accent: '--brand-accent',
    accentWarm: '--brand-accent-warm',
    background: '--brand-bg',
    text: '--brand-text',
  }
  const out: Record<string, string> = {}
  for (const [k, cssVar] of Object.entries(map)) {
    const v = colors?.[k]
    if (v && HEX.test(v)) out[cssVar] = v
  }
  return out
}

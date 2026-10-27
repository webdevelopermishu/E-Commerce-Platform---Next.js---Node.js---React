import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import { localizeHref } from '@/lib/links'

const tones = {
  green: 'bg-primary text-cream',
  mango: 'bg-accent text-ink',
  cream: 'bg-mango-tint text-ink',
} as const

export function AnnouncementBar({ text, href, tone, locale }: { text: string; href?: string | null; tone?: keyof typeof tones | null; locale: Locale }) {
  if (!text) return null
  const cls = `block px-4 py-2 text-center text-[0.9rem] ${tones[tone ?? 'green']}`
  return href ? (
    <Link href={localizeHref(href, locale)} className={`${cls} underline-offset-4 hover:underline`}>
      {text}
    </Link>
  ) : (
    <p className={cls}>{text}</p>
  )
}

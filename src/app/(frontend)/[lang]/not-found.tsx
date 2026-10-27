'use client'
import Link from 'next/link'
import { MangoMark } from '@/components/layout/Logo'
import { useI18n } from '@/components/providers/I18nProvider'

export default function NotFound() {
  const { dict, locale } = useI18n()
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-start justify-center py-16">
      <MangoMark className="h-14 w-14" />
      <h1 className="mt-6 text-[clamp(2rem,5vw,3.4rem)] text-primary">{dict.notFound.title}</h1>
      <p className="mt-3 max-w-[48ch] text-lg text-ink-soft">{dict.notFound.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/${locale}`} className="inline-flex h-12 items-center rounded-[var(--radius-control)] bg-primary px-6 font-medium text-white hover:bg-primary-deep">
          {dict.common.home}
        </Link>
        <Link href={`/${locale}/shop`} className="inline-flex h-12 items-center rounded-[var(--radius-control)] border border-primary px-6 font-medium text-primary hover:bg-leaf-tint">
          {dict.nav.shop}
        </Link>
      </div>
    </div>
  )
}

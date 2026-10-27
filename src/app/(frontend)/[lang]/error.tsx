'use client'
import { useEffect } from 'react'
import { useI18n } from '@/components/providers/I18nProvider'

/** Never shows stack traces or internal messages to customers. */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dict } = useI18n()
  useEffect(() => {
    console.error(error.digest ?? 'storefront error')
  }, [error])
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-start justify-center py-16">
      <h1 className="text-[clamp(2rem,5vw,3rem)] text-primary">{dict.error.title}</h1>
      <p className="mt-3 text-lg text-ink-soft">{dict.error.body}</p>
      <button type="button" onClick={reset} className="mt-8 inline-flex h-12 items-center rounded-[var(--radius-control)] bg-primary px-6 font-medium text-white hover:bg-primary-deep">
        {dict.common.tryAgain}
      </button>
    </div>
  )
}

'use client'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { retryPaymentAction } from '@/app/(frontend)/actions'
import { useI18n } from '../providers/I18nProvider'

export function RetryPayment({ orderNumber, token }: { orderNumber: string; token: string }) {
  const { dict } = useI18n()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setFailed(false)
          const res = await retryPaymentAction({ orderNumber, token }).catch(() => ({ error: 'network' }))
          if ('redirectTo' in res) window.location.assign(res.redirectTo)
          else {
            setFailed(true)
            setBusy(false)
          }
        }}
        className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] bg-primary px-5 font-medium text-white hover:bg-primary-deep disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {dict.order.retryPayment}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {dict.error.body}
        </p>
      )}
    </div>
  )
}

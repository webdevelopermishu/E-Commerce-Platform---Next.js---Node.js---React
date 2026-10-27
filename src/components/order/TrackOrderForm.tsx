'use client'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { trackOrderAction, type TrackState } from '@/app/(frontend)/actions'
import { useI18n } from '../providers/I18nProvider'

export function TrackOrderForm() {
  const { dict, locale } = useI18n()
  const router = useRouter()
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrderAction, { status: 'idle' })
  useEffect(() => {
    if (state.status === 'found') router.push(state.redirectTo)
  }, [state, router])
  const field = 'mt-1 h-12 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 text-base'
  return (
    <form action={action} className="mt-8 grid max-w-md gap-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="orderNumber" className="text-sm font-medium">
          {dict.order.number}
        </label>
        <input id="orderNumber" name="orderNumber" required autoComplete="off" placeholder="AK-261026-XXXXX" className={`${field} uppercase`} />
      </div>
      <div>
        <label htmlFor="track-phone" className="text-sm font-medium">
          {dict.checkout.phone}
        </label>
        <input id="track-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" className={field} />
      </div>
      {state.status === 'not_found' && (
        <p role="alert" className="text-sm text-danger">
          {dict.order.trackNotFound}
        </p>
      )}
      {state.status === 'rate_limited' && (
        <p role="alert" className="text-sm text-danger">
          {dict.checkout.rateLimited}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-12 rounded-[var(--radius-control)] bg-primary font-medium text-white hover:bg-primary-deep disabled:opacity-60">
        {pending ? dict.common.loading : dict.order.trackSubmit}
      </button>
    </form>
  )
}

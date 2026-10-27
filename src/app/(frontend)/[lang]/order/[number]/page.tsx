import { CheckCircle2, CircleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RetryPayment } from '@/components/order/RetryPayment'
import { districtName } from '@/lib/bd-locations'
import { getDictionary } from '@/lib/i18n'
import { formatDate, formatPrice, interpolate } from '@/lib/i18n/format'
import { getOrderWithToken } from '@/server/orders/lookup'
import { resolveLocale } from '@/server/page-helpers'
import { getPayloadClient } from '@/server/payload'

type Props = { params: Promise<{ lang: string; number: string }>; searchParams: Promise<{ t?: string; payment?: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' }

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const

export default async function OrderPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params)
  const { number } = await params
  const { t: token, payment } = await searchParams
  const dict = getDictionary(locale)
  const payload = await getPayloadClient()
  const order = await getOrderWithToken(payload, decodeURIComponent(number), token)
  if (!order) notFound()

  const fp = (v: number) => formatPrice(v, locale)
  const cancelled = order.status === 'cancelled'
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number])
  const online = order.paymentMethod !== 'cod'
  const needsPayment = online && !cancelled && ['pending', 'failed', 'cancelled'].includes(order.paymentStatus)
  const methodLabel = { cod: dict.checkout.cod, sslcommerz: 'SSLCommerz', bkash: locale === 'bn' ? 'বিকাশ' : 'bKash', nagad: locale === 'bn' ? 'নগদ' : 'Nagad' }[order.paymentMethod]

  return (
    <div className="container-page max-w-3xl py-10 md:py-14">
      {payment === 'failed' || (needsPayment && payment !== 'success') ? (
        <div className="flex gap-3 rounded-[var(--radius-card)] bg-[#FBE9E5] p-5">
          <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-danger" aria-hidden />
          <div>
            <h1 className="font-display text-2xl text-ink">{payment === 'failed' ? dict.order.paymentFailed : dict.order.payPending}</h1>
            {needsPayment && token && <RetryPayment orderNumber={order.orderNumber} token={token} />}
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <CheckCircle2 className="mt-1 h-8 w-8 shrink-0 text-secondary" aria-hidden />
          <div>
            <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] text-primary">{dict.order.confirmedTitle}</h1>
            <p className="mt-2 text-ink-soft">{interpolate(dict.order.confirmedBody, { phone: order.customerPhoneMasked })}</p>
          </div>
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-[var(--radius-card)] bg-paper p-5 ring-1 ring-line sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-soft">{dict.order.number}</dt>
          <dd className="font-semibold tracking-wide" data-testid="order-number">
            {order.orderNumber}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{dict.order.placedOn}</dt>
          <dd className="font-medium">{formatDate(order.createdAt, locale)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{dict.order.status}</dt>
          <dd className="font-medium" data-testid="order-status">
            {dict.order.statuses[order.status]}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">{dict.order.paymentStatus}</dt>
          <dd className="font-medium">{dict.order.paymentStatuses[order.paymentStatus]}</dd>
        </div>
      </dl>

      {!cancelled && (
        <section className="mt-8" aria-labelledby="progress-title">
          <h2 id="progress-title" className="sr-only">
            {dict.order.history}
          </h2>
          <ol className="grid grid-cols-5 gap-1">
            {STEPS.map((s, i) => (
              <li key={s} className="text-center">
                <span className={`mx-auto block h-1.5 rounded-full ${i <= stepIndex ? 'bg-secondary' : 'bg-line'}`} aria-hidden />
                <span className={`mt-2 block text-[0.72rem] leading-tight sm:text-xs ${i <= stepIndex ? 'font-semibold text-ink' : 'text-ink-soft'}`} aria-current={i === stepIndex ? 'step' : undefined}>
                  {dict.order.statuses[s]}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-10" aria-labelledby="items-title">
        <h2 id="items-title" className="text-2xl text-primary">
          {dict.order.items}
        </h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between gap-4 py-3">
              <span>
                <span className="font-medium">{i.productName}</span>
                <span className="block text-sm text-ink-soft">
                  {i.variantLabel} × {i.quantity.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en')} · {fp(i.unitPrice)}
                </span>
              </span>
              <span className="font-medium tabular-nums">{fp(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 max-w-xs space-y-1.5 text-[0.95rem]">
          <div className="flex justify-between">
            <dt>{dict.cart.subtotal}</dt>
            <dd className="tabular-nums">{fp(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-secondary">
              <dt>{dict.cart.discount}</dt>
              <dd className="tabular-nums">−{fp(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>{dict.cart.shipping}</dt>
            <dd className="tabular-nums">{order.shippingFee ? fp(order.shippingFee) : dict.cart.free}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
            <dt>{dict.cart.total}</dt>
            <dd className="tabular-nums" data-testid="order-total">
              {fp(order.total)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-sans text-sm font-semibold text-ink-soft">{dict.order.deliverTo}</h2>
          <p className="mt-1">
            {order.customerName}
            <br />
            {order.address}
            <br />
            {order.area}
            {order.district ? `, ${districtName(order.district, locale)}` : ''}
          </p>
        </div>
        <div>
          <h2 className="font-sans text-sm font-semibold text-ink-soft">{dict.order.paymentMethod}</h2>
          <p className="mt-1">{methodLabel}</p>
        </div>
      </section>

      <p className="mt-10 rounded-[var(--radius-control)] bg-mango-tint p-4 text-sm">{dict.order.saveLink}</p>
      <p className="mt-6">
        <Link href={`/${locale}/shop`} className="font-medium text-primary underline underline-offset-4">
          {dict.cart.continueShopping}
        </Link>
      </p>
    </div>
  )
}

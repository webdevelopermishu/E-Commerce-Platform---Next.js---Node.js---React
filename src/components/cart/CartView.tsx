'use client'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '../providers/CartProvider'
import { useI18n } from '../providers/I18nProvider'
import { QuantityStepper } from './QuantityStepper'
import { useCartQuote } from './useCartQuote'

export function CartView() {
  const { lines, ready, setQuantity, remove, couponCode, setCouponCode } = useCart()
  const { dict, locale, price, t } = useI18n()
  const { data, loading, error } = useCartQuote()
  const [couponInput, setCouponInput] = useState(couponCode)

  if (!ready) return <p className="py-16 text-ink-soft">{dict.common.loading}</p>
  if (lines.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-3xl text-primary">{dict.cart.empty}</p>
        <p className="mt-2 text-ink-soft">{dict.cart.emptyHint}</p>
        <Link href={`/${locale}/shop`} className="mt-6 inline-flex h-12 items-center rounded-[var(--radius-control)] bg-primary px-6 font-medium text-white hover:bg-primary-deep">
          {dict.cart.startShopping}
        </Link>
      </div>
    )
  }

  const totals = data?.totals
  const priced = (pid: number, vid: string) => totals?.lines.find((l) => Number(l.productId) === pid && l.variantId === vid)
  const hasIssues = Boolean(totals && totals.lines.some((l) => l.issue))

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-line border-y border-line" aria-busy={loading}>
        {lines.map((l) => {
          const p = priced(l.productId, l.variantId)
          return (
            <li key={`${l.productId}:${l.variantId}`} className="flex gap-4 py-5" data-testid="cart-line">
              <Link href={`/${locale}/product/${l.snapshot.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-mango-tint sm:h-28 sm:w-28">
                {l.snapshot.imageUrl && <Image src={l.snapshot.imageUrl} alt="" fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link href={`/${locale}/product/${l.snapshot.slug}`} className="font-semibold hover:text-primary">
                      {p?.name || l.snapshot.name}
                    </Link>
                    <p className="text-sm text-ink-soft">{p?.variantLabel || l.snapshot.variantLabel}</p>
                    {p && <p className="mt-0.5 text-sm text-ink-soft">{price(p.unitPrice)}</p>}
                  </div>
                  <p className="font-semibold tabular-nums" data-testid="line-total">
                    {p ? price(p.lineTotal || p.unitPrice * l.quantity) : '—'}
                  </p>
                </div>
                {p?.issue && (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {t(dict.cart.issues[p.issue], { available: p.available })}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <QuantityStepper value={l.quantity} onChange={(q) => setQuantity(l.productId, l.variantId, q)} max={Math.min(50, Math.max(1, p?.available ?? 50))} />
                  <button
                    type="button"
                    onClick={() => remove(l.productId, l.variantId)}
                    className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-danger"
                    aria-label={t(dict.cart.removeItem, { name: l.snapshot.name })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> {dict.cart.remove}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <aside className="h-fit rounded-[var(--radius-card)] bg-paper p-6 ring-1 ring-line lg:sticky lg:top-24" aria-labelledby="summary-title">
        <h2 id="summary-title" className="text-2xl text-primary">
          {dict.checkout.summary}
        </h2>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setCouponCode(couponInput.trim())
          }}
        >
          <label htmlFor="coupon" className="sr-only">
            {dict.cart.coupon}
          </label>
          <input
            id="coupon"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder={dict.cart.coupon}
            className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line bg-cream px-3 uppercase"
            autoCapitalize="characters"
          />
          <button type="submit" className="h-11 rounded-[var(--radius-control)] border border-primary px-4 font-medium text-primary hover:bg-leaf-tint">
            {dict.cart.applyCoupon}
          </button>
        </form>
        {couponCode && totals?.couponError && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {dict.coupon[totals.couponError]}
          </p>
        )}
        {couponCode && totals?.couponCode && (
          <p className="mt-2 flex items-center justify-between text-sm text-secondary">
            {t(dict.cart.couponApplied, { code: totals.couponCode })}
            <button type="button" className="underline" onClick={() => (setCouponCode(''), setCouponInput(''))}>
              {dict.cart.removeCoupon}
            </button>
          </p>
        )}
        <dl className="mt-5 space-y-2 text-[0.95rem]" aria-live="polite">
          <div className="flex justify-between">
            <dt>{dict.cart.subtotal}</dt>
            <dd className="tabular-nums" data-testid="cart-subtotal">
              {totals ? price(totals.subtotal) : '—'}
            </dd>
          </div>
          {totals && totals.discount > 0 && (
            <div className="flex justify-between text-secondary">
              <dt>{dict.cart.discount}</dt>
              <dd className="tabular-nums">−{price(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-ink-soft">
            <dt>{dict.cart.shipping}</dt>
            <dd>{dict.cart.shippingAtCheckout}</dd>
          </div>
        </dl>
        {error && <p className="mt-3 text-sm text-danger">{dict.error.body}</p>}
        {hasIssues && <p className="mt-3 text-sm text-danger">{dict.checkout.fixCart}</p>}
        {hasIssues ? (
          <span aria-disabled className="mt-6 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-[var(--radius-control)] bg-line font-medium text-ink-soft">
            {dict.cart.checkout}
          </span>
        ) : (
          <Link href={`/${locale}/checkout`} data-testid="go-checkout" className="mt-6 flex h-12 w-full items-center justify-center rounded-[var(--radius-control)] bg-primary font-medium text-white hover:bg-primary-deep">
            {dict.cart.checkout}
          </Link>
        )}
        <Link href={`/${locale}/shop`} className="mt-3 block text-center text-sm text-ink-soft underline-offset-4 hover:underline">
          {dict.cart.continueShopping}
        </Link>
      </aside>
    </div>
  )
}

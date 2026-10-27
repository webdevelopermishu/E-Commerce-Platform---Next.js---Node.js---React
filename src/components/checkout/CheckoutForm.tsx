'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { placeOrderAction } from '@/app/(frontend)/actions'
import { districts, divisions } from '@/lib/bd-locations'
import { checkoutSchema, type CheckoutFormValues } from '@/lib/validation/checkout'
import { useCartQuote } from '../cart/useCartQuote'
import { useCart } from '../providers/CartProvider'
import { useI18n } from '../providers/I18nProvider'

export interface CheckoutOptions {
  methods: { code: string; name: string; description: string; surcharge: number }[]
  payments: { id: 'cod' | 'sslcommerz' | 'bkash' | 'nagad'; label: string; maxTotal: number | null }[]
  note?: string | null
}

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
}

export function CheckoutForm({ options }: { options: CheckoutOptions }) {
  const { dict, locale, price, t } = useI18n()
  const { lines, ready, couponCode, clear } = useCart()
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // One key per checkout attempt: a double-click or network retry cannot create two orders.
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      division: '',
      district: '',
      area: '',
      address: '',
      notes: '',
      deliveryMethod: options.methods[0]?.code ?? '',
      paymentMethod: options.payments[0]?.id ?? 'cod',
    },
  })
  const division = useWatch({ control, name: 'division' })
  const district = useWatch({ control, name: 'district' })
  const deliveryMethod = useWatch({ control, name: 'deliveryMethod' })
  const paymentMethod = useWatch({ control, name: 'paymentMethod' })
  const districtOptions = useMemo(() => districts.filter((d) => d.division === division), [division])

  useEffect(() => {
    if (district && !districtOptions.some((d) => d.code === district)) setValue('district', '')
  }, [division, district, districtOptions, setValue])

  const { data, loading } = useCartQuote({ district: district || undefined, deliveryMethod })
  const totals = data?.totals
  const payments = options.payments.filter((p) => p.maxTotal == null || !totals || totals.total <= p.maxTotal)

  const err = (k: keyof CheckoutFormValues) => {
    const m = errors[k]?.message
    if (!m) return null
    const text = (dict.checkout.errors as Record<string, string>)[m] ?? dict.checkout.genericError
    return (
      <p id={`${k}-error`} role="alert" className="mt-1 text-sm text-danger">
        {text}
      </p>
    )
  }
  const input = (k: keyof CheckoutFormValues) =>
    `mt-1 h-12 w-full rounded-[var(--radius-control)] border bg-paper px-3 text-base focus:outline-none focus:ring-2 focus:ring-secondary ${errors[k] ? 'border-danger' : 'border-line'}`

  if (!ready) return <p className="py-16 text-ink-soft">{dict.common.loading}</p>
  if (lines.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-2xl text-primary">{dict.checkout.emptyCart}</p>
        <Link href={`/${locale}/shop`} className="mt-6 inline-flex h-12 items-center rounded-[var(--radius-control)] bg-primary px-6 font-medium text-white">
          {dict.cart.startShopping}
        </Link>
      </div>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    if (submitting) return
    setSubmitting(true)
    setServerError(null)
    try {
      const res = await placeOrderAction({
        form: values,
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
        couponCode: couponCode || undefined,
        idempotencyKey,
        locale,
      })
      if (res.ok) {
        clear()
        if (/^https?:\/\//.test(res.redirectTo) && !res.redirectTo.startsWith(window.location.origin)) window.location.assign(res.redirectTo)
        else router.push(res.redirectTo)
        return
      }
      if (res.fieldErrors) for (const [k, v] of Object.entries(res.fieldErrors)) setError(k as keyof CheckoutFormValues, { message: v })
      setServerError(
        res.error === 'rate_limited'
          ? dict.checkout.rateLimited
          : res.error === 'stock_changed' || res.error === 'cart_issues'
            ? dict.checkout.stockChanged
            : dict.checkout.genericError,
      )
      // A failed attempt that did not create an order may safely retry with a fresh key.
      setIdempotencyKey(newKey())
      setSubmitting(false)
    } catch {
      setServerError(dict.checkout.genericError)
      setSubmitting(false)
    }
  })

  const noOptions = options.methods.length === 0 || options.payments.length === 0
  const blocked = !totals || !totals.purchasable || data?.deliveryAvailable === false

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_400px]" data-testid="checkout-form">
      <div className="space-y-10">
        <fieldset>
          <legend className="font-display text-2xl text-primary">{dict.checkout.contact}</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="text-sm font-medium">
                {dict.checkout.name}
              </label>
              <input id="name" autoComplete="name" {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} className={input('name')} />
              {err('name')}
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-medium">
                {dict.checkout.phone}
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                {...register('phone')}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
                className={input('phone')}
              />
              <p id="phone-hint" className="mt-1 text-xs text-ink-soft">
                {dict.checkout.phoneHint}
              </p>
              {err('phone')}
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                {dict.checkout.email} <span className="font-normal text-ink-soft">({dict.common.optional})</span>
              </label>
              <input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} className={input('email')} />
              <p className="mt-1 text-xs text-ink-soft">{dict.checkout.emailHint}</p>
              {err('email')}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-primary">{dict.checkout.address}</legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="division" className="text-sm font-medium">
                {dict.checkout.division}
              </label>
              <select id="division" {...register('division')} aria-invalid={!!errors.division} className={input('division')}>
                <option value="">{dict.checkout.selectDivision}</option>
                {divisions.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d[locale]}
                  </option>
                ))}
              </select>
              {err('division')}
            </div>
            <div>
              <label htmlFor="district" className="text-sm font-medium">
                {dict.checkout.district}
              </label>
              <select id="district" {...register('district')} disabled={!division} aria-invalid={!!errors.district} className={`${input('district')} disabled:opacity-60`}>
                <option value="">{dict.checkout.selectDistrict}</option>
                {districtOptions.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d[locale]}
                  </option>
                ))}
              </select>
              {err('district')}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="area" className="text-sm font-medium">
                {dict.checkout.area}
              </label>
              <input id="area" autoComplete="address-level3" {...register('area')} aria-invalid={!!errors.area} className={input('area')} />
              {err('area')}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="text-sm font-medium">
                {dict.checkout.fullAddress}
              </label>
              <textarea id="address" rows={3} autoComplete="street-address" {...register('address')} aria-invalid={!!errors.address} className={`${input('address')} h-auto py-2.5`} />
              {err('address')}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium">
                {dict.checkout.notes} <span className="font-normal text-ink-soft">({dict.common.optional})</span>
              </label>
              <textarea id="notes" rows={2} placeholder={dict.checkout.notesHint} {...register('notes')} className={`${input('notes')} h-auto py-2.5`} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-primary">{dict.checkout.deliveryMethod}</legend>
          {options.methods.length === 0 ? (
            <p className="mt-3 text-danger">{dict.checkout.noMethods}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {options.methods.map((m) => (
                <label key={m.code} className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border p-4 ${deliveryMethod === m.code ? 'border-primary bg-leaf-tint' : 'border-line bg-paper'}`}>
                  <input type="radio" value={m.code} {...register('deliveryMethod')} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                  <span className="flex-1">
                    <span className="block font-medium">{m.name}</span>
                    {m.description && <span className="block text-sm text-ink-soft">{m.description}</span>}
                  </span>
                  {m.surcharge > 0 && <span className="text-sm font-medium">+{price(m.surcharge)}</span>}
                </label>
              ))}
              {data?.zoneEstimate && <p className="text-sm text-ink-soft">{t(dict.checkout.estimate, { estimate: data.zoneEstimate })}</p>}
            </div>
          )}
          {err('deliveryMethod')}
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl text-primary">{dict.checkout.payment}</legend>
          {payments.length === 0 ? (
            <p className="mt-3 text-danger">{dict.checkout.noPayments}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {payments.map((p) => (
                <label key={p.id} className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border p-4 ${paymentMethod === p.id ? 'border-primary bg-leaf-tint' : 'border-line bg-paper'}`}>
                  <input type="radio" value={p.id} {...register('paymentMethod')} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" data-testid={`pay-${p.id}`} />
                  <span>
                    <span className="block font-medium">{p.label}</span>
                    <span className="block text-sm text-ink-soft">{p.id === 'cod' ? dict.checkout.codHint : t(dict.checkout.gatewayHint, { name: p.label })}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {options.note && <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{options.note}</p>}
          {err('paymentMethod')}
        </fieldset>
      </div>

      <aside className="h-fit rounded-[var(--radius-card)] bg-paper p-6 ring-1 ring-line lg:sticky lg:top-24" aria-labelledby="co-summary">
        <h2 id="co-summary" className="text-2xl text-primary">
          {dict.checkout.summary}
        </h2>
        <ul className="mt-4 divide-y divide-line" aria-busy={loading}>
          {lines.map((l) => {
            const p = totals?.lines.find((x) => Number(x.productId) === l.productId && x.variantId === l.variantId)
            return (
              <li key={`${l.productId}:${l.variantId}`} className="flex gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-mango-tint">
                  {l.snapshot.imageUrl && <Image src={l.snapshot.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">{p?.name || l.snapshot.name}</p>
                  <p className="text-ink-soft">
                    {p?.variantLabel || l.snapshot.variantLabel} × {l.quantity.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en')}
                  </p>
                  {p?.issue && <p className="text-danger">{t(dict.cart.issues[p.issue], { available: p.available })}</p>}
                </div>
                <p className="text-sm font-medium tabular-nums">{p ? price(p.lineTotal) : '—'}</p>
              </li>
            )
          })}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[0.95rem]" aria-live="polite">
          <div className="flex justify-between">
            <dt>{dict.cart.subtotal}</dt>
            <dd className="tabular-nums">{totals ? price(totals.subtotal) : '—'}</dd>
          </div>
          {totals && totals.discount > 0 && (
            <div className="flex justify-between text-secondary">
              <dt>
                {dict.cart.discount} ({totals.couponCode})
              </dt>
              <dd className="tabular-nums">−{price(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>{dict.cart.shipping}</dt>
            <dd className="tabular-nums">{!district ? dict.cart.shippingAtCheckout : totals ? (totals.shipping === 0 ? dict.cart.free : price(totals.shipping)) : '—'}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
            <dt>{dict.cart.total}</dt>
            <dd className="tabular-nums" data-testid="checkout-total">
              {totals ? price(totals.total) : '—'}
            </dd>
          </div>
        </dl>
        {couponCode && totals?.couponError && <p className="mt-2 text-sm text-danger">{dict.coupon[totals.couponError]}</p>}
        {totals && !totals.purchasable && <p className="mt-3 text-sm text-danger">{dict.checkout.fixCart}</p>}
        {serverError && (
          <p role="alert" className="mt-3 rounded-[var(--radius-control)] bg-[#FBE9E5] p-3 text-sm text-danger">
            {serverError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || noOptions || blocked}
          aria-busy={submitting}
          data-testid="place-order"
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {submitting ? (paymentMethod === 'cod' ? dict.checkout.placing : dict.checkout.redirecting) : paymentMethod === 'cod' ? dict.checkout.placeOrder : dict.checkout.payNow}
        </button>
        <p className="mt-3 text-xs text-ink-soft">{dict.checkout.agree}</p>
      </aside>
    </form>
  )
}

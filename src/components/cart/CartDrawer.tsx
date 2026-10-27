'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Trash2, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useCart } from '../providers/CartProvider'
import { useI18n } from '../providers/I18nProvider'
import { QuantityStepper } from './QuantityStepper'
import { useCartQuote } from './useCartQuote'

/** Slide-in mini cart. Opens after "Add to cart" with the just-added item highlighted. */
export function CartDrawer() {
  const { lines, drawerOpen, setDrawerOpen, setQuantity, remove, lastAdded, dismissLastAdded } = useCart()
  const { dict, locale, price, t } = useI18n()
  const pathname = usePathname()
  const { data, loading } = useCartQuote({ enabled: drawerOpen, withCoupon: false })

  // Close on navigation (adjusting state during render, per React guidance, instead of in an effect).
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    if (drawerOpen) setDrawerOpen(false)
  }
  useEffect(() => {
    if (!drawerOpen) dismissLastAdded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen])

  // lastAdded is cleared whenever the drawer closes, so it only ever describes this opening.
  const recent = lastAdded
  const priced = (productId: number, variantId: string) => data?.totals.lines.find((l) => Number(l.productId) === productId && l.variantId === variantId)

  return (
    <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content
          data-testid="cart-drawer"
          className="drawer-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="font-display text-2xl text-primary">{recent ? dict.cart.addedTitle : dict.cart.title}</Dialog.Title>
            <Dialog.Close aria-label={dict.common.close} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-leaf-tint">
              <X className="h-6 w-6" aria-hidden />
            </Dialog.Close>
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-start justify-center gap-3 px-6">
              <p className="font-display text-2xl text-primary">{dict.cart.empty}</p>
              <p className="text-ink-soft">{dict.cart.emptyHint}</p>
              <Link href={`/${locale}/shop`} className="mt-2 inline-flex h-11 items-center rounded-[var(--radius-control)] bg-primary px-5 font-medium text-white hover:bg-primary-deep">
                {dict.cart.startShopping}
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5" aria-busy={loading}>
                {lines.map((l) => {
                  const p = priced(l.productId, l.variantId)
                  const isRecent = recent && recent.line.productId === l.productId && recent.line.variantId === l.variantId
                  return (
                    <li key={`${l.productId}:${l.variantId}`} className={`flex gap-3 py-4 ${isRecent ? 'relative' : ''}`}>
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-mango-tint">
                        {l.snapshot.imageUrl && <Image src={l.snapshot.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {isRecent && (
                          <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-secondary">
                            <Check className="h-3.5 w-3.5" aria-hidden /> {dict.product.added}
                          </p>
                        )}
                        <Link href={`/${locale}/product/${l.snapshot.slug}`} className="line-clamp-2 font-medium hover:text-primary">
                          {p?.name || l.snapshot.name}
                        </Link>
                        <p className="text-sm text-ink-soft">{p?.variantLabel || l.snapshot.variantLabel}</p>
                        {p?.issue && (
                          <p className="mt-1 text-sm text-danger">{t(dict.cart.issues[p.issue], { available: p.available })}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <QuantityStepper size="sm" value={l.quantity} onChange={(q) => setQuantity(l.productId, l.variantId, q)} max={Math.min(50, p?.available || 50)} />
                          <span className="font-semibold tabular-nums">{price(p ? p.unitPrice * l.quantity : l.snapshot.unitPrice * l.quantity)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.productId, l.variantId)}
                        aria-label={t(dict.cart.removeItem, { name: l.snapshot.name })}
                        className="self-start p-1 text-ink-soft hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="border-t border-line bg-paper px-5 py-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between text-lg">
                  <span>{dict.cart.subtotal}</span>
                  <span className="font-semibold tabular-nums" aria-live="polite">
                    {data ? price(data.totals.subtotal) : loading ? dict.common.loading : '—'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {dict.cart.shipping}: {dict.cart.shippingAtCheckout}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href={`/${locale}/cart`} className="inline-flex h-12 items-center justify-center rounded-[var(--radius-control)] border border-primary font-medium text-primary hover:bg-leaf-tint">
                    {dict.cart.viewCart}
                  </Link>
                  <Link href={`/${locale}/checkout`} className="inline-flex h-12 items-center justify-center rounded-[var(--radius-control)] bg-primary font-medium text-white hover:bg-primary-deep">
                    {dict.cart.checkout}
                  </Link>
                </div>
                <Dialog.Close className="mt-2 w-full py-2 text-sm text-ink-soft underline-offset-4 hover:underline">{dict.cart.continueShopping}</Dialog.Close>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

'use client'
import { useEffect, useRef, useState } from 'react'
import type { VariantData } from '@/server/queries'
import { QuantityStepper } from '../cart/QuantityStepper'
import { useI18n } from '../providers/I18nProvider'
import { AddToCartButton } from './AddToCartButton'
import { PriceTag } from './PriceTag'

export function ProductPurchase({ product, variants }: { product: { id: number; slug: string; name: string; imageUrl: string | null }; variants: VariantData[] }) {
  const { dict, locale, t, price } = useI18n()
  const firstInStock = variants.findIndex((v) => v.stock > 0)
  const [index, setIndex] = useState(firstInStock === -1 ? 0 : firstInStock)
  const [qty, setQty] = useState(1)
  const [showSticky, setShowSticky] = useState(false)
  const mainCta = useRef<HTMLDivElement>(null)
  const v = variants[index]

  // Derived clamp: switching to a variant with less stock never leaves an impossible quantity selected.
  const quantity = v ? Math.max(1, Math.min(qty, Math.max(1, v.stock))) : qty

  useEffect(() => {
    const el = mainCta.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setShowSticky(!e!.isIntersecting && e!.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  if (!v) return null
  const inStock = v.stock > 0
  const low = inStock && v.stock <= v.lowStockThreshold
  const variant = { id: v.id, label: v.label, price: v.price, stock: v.stock }

  return (
    <div>
      <PriceTag price={v.price} regularPrice={v.regularPrice} onSale={v.onSale} discountPercent={v.discountPercent} locale={locale} dict={dict} size="lg" />
      <p className={`mt-2 text-sm font-medium ${inStock ? (low ? 'text-[#B5530F]' : 'text-secondary') : 'text-danger'}`} data-testid="stock-status">
        {!inStock ? dict.product.outOfStock : low ? t(dict.product.lowStock, { count: v.stock }) : dict.product.inStock}
      </p>

      {variants.length > 1 && (
        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-semibold">{dict.product.chooseOption}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((x, i) => (
              <label
                key={x.id}
                className={`relative cursor-pointer rounded-[var(--radius-control)] border px-4 py-2.5 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent-warm ${
                  i === index ? 'border-primary bg-primary text-white' : 'border-line bg-paper hover:border-secondary'
                } ${x.stock <= 0 ? 'opacity-55' : ''}`}
              >
                <input type="radio" name="variant" value={x.id} checked={i === index} onChange={() => setIndex(i)} className="sr-only" />
                <span className="font-medium">{x.label}</span>
                {x.stock <= 0 && <span className="ml-1 text-xs">({dict.product.outOfStock})</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div ref={mainCta} className="mt-6 grid gap-3 sm:grid-cols-[auto_1fr]">
        {inStock && <QuantityStepper value={quantity} onChange={setQty} max={Math.min(50, v.stock)} />}
        <AddToCartButton product={product} variant={variant} quantity={quantity} size="lg" />
        {inStock && <AddToCartButton product={product} variant={variant} quantity={quantity} size="lg" buyNow className="sm:col-span-2" />}
      </div>

      {/* Mobile sticky bar, shown once the main buttons scroll out of view. */}
      <div
        aria-hidden={!showSticky}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur transition-transform duration-200 md:hidden ${
          showSticky ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        inert={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-sm text-ink-soft">
              {v.label} · <span className="font-semibold text-ink">{price(v.price)}</span>
            </p>
          </div>
          <div className="w-44">
            <AddToCartButton product={product} variant={variant} quantity={quantity} />
          </div>
        </div>
      </div>
    </div>
  )
}

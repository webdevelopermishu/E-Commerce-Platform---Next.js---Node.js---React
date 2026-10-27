'use client'
import { useId, useState } from 'react'
import type { VariantData } from '@/server/queries'
import { useI18n } from '../providers/I18nProvider'
import { AddToCartButton } from './AddToCartButton'
import { PriceTag } from './PriceTag'

/** Size selector + price + add-to-cart for a product card. */
export function ProductCardActions({
  product,
  variants,
}: {
  product: { id: number; slug: string; name: string; imageUrl: string | null }
  variants: VariantData[]
}) {
  const { dict, locale } = useI18n()
  const firstInStock = variants.findIndex((v) => v.stock > 0)
  const [index, setIndex] = useState(firstInStock === -1 ? 0 : firstInStock)
  const v = variants[index]
  const selectId = useId()
  if (!v) return null
  const low = v.stock > 0 && v.stock <= v.lowStockThreshold

  return (
    <div className="mt-auto space-y-3 pt-3">
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-2">
        <PriceTag price={v.price} regularPrice={v.regularPrice} onSale={v.onSale} discountPercent={v.discountPercent} locale={locale} dict={dict} />
        {variants.length > 1 ? (
          <>
            <label htmlFor={selectId} className="sr-only">
              {dict.product.chooseOption}
            </label>
            <select
              id={selectId}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              className="h-9 max-w-full shrink-0 rounded-[var(--radius-control)] border border-line bg-paper pl-2 pr-7 text-sm"
            >
              {variants.map((x, i) => (
                <option key={x.id} value={i}>
                  {x.label}
                  {x.stock <= 0 ? ` — ${dict.product.outOfStock}` : ''}
                </option>
              ))}
            </select>
          </>
        ) : (
          <span className="text-sm text-ink-soft">{v.label}</span>
        )}
      </div>
      {low && <p className="text-xs font-medium text-[#B5530F]">{dict.product.lowStock.replace('{count}', v.stock.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en'))}</p>}
      <AddToCartButton product={product} variant={{ id: v.id, label: v.label, price: v.price, stock: v.stock }} />
    </div>
  )
}

import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import { formatPrice, interpolate } from '@/lib/i18n/format'

export function PriceTag({
  price,
  regularPrice,
  onSale,
  discountPercent,
  locale,
  dict,
  size = 'md',
}: {
  price: number
  regularPrice: number
  onSale: boolean
  discountPercent: number
  locale: Locale
  dict: Dictionary
  size?: 'md' | 'lg'
}) {
  const big = size === 'lg' ? 'text-3xl' : 'text-lg'
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`${big} font-semibold tabular-nums ${onSale ? 'text-[#B5530F]' : 'text-ink'}`}>
        <span className="sr-only">{onSale ? dict.product.salePrice : ''} </span>
        {formatPrice(price, locale)}
      </span>
      {onSale && (
        <>
          <s className="text-sm text-ink-soft tabular-nums">
            <span className="sr-only">{dict.product.regularPrice} </span>
            {formatPrice(regularPrice, locale)}
          </s>
          {discountPercent > 0 && (
            <span className="rounded-[6px] bg-accent px-1.5 py-0.5 text-xs font-semibold text-ink">
              {interpolate(dict.product.off, { percent: locale === 'bn' ? discountPercent.toLocaleString('bn-BD') : discountPercent })}
            </span>
          )}
        </>
      )}
    </div>
  )
}

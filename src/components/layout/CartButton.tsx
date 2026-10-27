'use client'
import { ShoppingBag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '../providers/CartProvider'
import { useI18n } from '../providers/I18nProvider'

export function CartButton() {
  const { count, ready, setDrawerOpen, lastAdded } = useCart()
  const { dict, t, locale } = useI18n()
  const [pop, setPop] = useState(false)
  const prev = useRef(lastAdded?.at)
  useEffect(() => {
    if (lastAdded && lastAdded.at !== prev.current) {
      prev.current = lastAdded.at
      setPop(true)
      const id = setTimeout(() => setPop(false), 400)
      return () => clearTimeout(id)
    }
  }, [lastAdded])

  const label = `${dict.nav.cart}${ready && count ? `, ${t(dict.cart.itemCount, { count })}` : ''}`
  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-label={label}
      data-testid="cart-button"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-primary hover:bg-leaf-tint"
    >
      <ShoppingBag className="h-6 w-6" aria-hidden />
      {ready && count > 0 && (
        <span
          data-testid="cart-count"
          className={`absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent-warm px-1 text-center text-[11px] font-semibold leading-5 text-ink ${pop ? 'cart-pop' : ''}`}
        >
          {count > 99 ? '99+' : count.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en')}
        </span>
      )}
    </button>
  )
}

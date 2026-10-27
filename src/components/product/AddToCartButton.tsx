'use client'
import { Check, Loader2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { checkAddToCartAction } from '@/app/(frontend)/actions'
import { useCart } from '../providers/CartProvider'
import { useI18n } from '../providers/I18nProvider'

type State = 'idle' | 'adding' | 'added' | 'error'

export interface AddToCartProps {
  product: { id: number; slug: string; name: string; imageUrl: string | null }
  variant: { id: string; label: string; price: number; stock: number } | null
  quantity?: number
  size?: 'md' | 'lg'
  buyNow?: boolean
  className?: string
}

/**
 * Signature add-to-cart: checks stock on the server, shows adding → added, prevents double submits,
 * announces the result to screen readers, and opens the mini cart.
 */
export function AddToCartButton({ product, variant, quantity = 1, size = 'md', buyNow = false, className = '' }: AddToCartProps) {
  const { dict, locale } = useI18n()
  const { add, lines, setDrawerOpen } = useCart()
  const router = useRouter()
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const busy = useRef(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => void (resetTimer.current && clearTimeout(resetTimer.current)), [])

  const outOfStock = !variant || variant.stock <= 0
  const inCart = variant ? (lines.find((l) => l.productId === product.id && l.variantId === variant.id)?.quantity ?? 0) : 0

  async function onClick() {
    if (busy.current || outOfStock || !variant) return
    busy.current = true
    setState('adding')
    setMessage('')
    try {
      const res = await checkAddToCartAction({ productId: product.id, variantId: variant.id, quantity: inCart + quantity, locale })
      if (!res.ok) {
        setState('error')
        setMessage(
          res.reason === 'out_of_stock'
            ? dict.product.outOfStock
            : res.reason === 'insufficient_stock'
              ? dict.cart.issues.insufficient_stock.replace('{available}', res.available.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en'))
              : dict.product.addError,
        )
      } else {
        add({
          productId: product.id,
          variantId: variant.id,
          quantity,
          snapshot: { name: product.name, variantLabel: variant.label, slug: product.slug, imageUrl: product.imageUrl, unitPrice: variant.price },
        })
        setState('added')
        setMessage(dict.product.added)
        if (buyNow) router.push(`/${locale}/checkout`)
        else setDrawerOpen(true)
      }
    } catch {
      setState('error')
      setMessage(dict.product.addError)
    } finally {
      busy.current = false
      resetTimer.current = setTimeout(() => setState((s) => (s === 'adding' ? s : 'idle')), 2200)
    }
  }

  const h = size === 'lg' ? 'h-13 text-base' : 'h-11 text-[0.95rem]'
  const base = `group relative inline-flex w-full select-none items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 font-medium
    transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.97] disabled:active:scale-100 ${h}`
  const tone = outOfStock
    ? 'cursor-not-allowed border border-line bg-paper text-ink-soft'
    : buyNow
      ? 'border border-primary bg-transparent text-primary hover:bg-leaf-tint'
      : state === 'added'
        ? 'bg-secondary text-white shadow-[0_6px_16px_-8px_rgba(36,91,50,0.7)]'
        : 'bg-primary text-white shadow-[0_6px_16px_-8px_rgba(36,91,50,0.7)] hover:bg-[color-mix(in_oklab,var(--color-primary)_88%,white)] hover:shadow-[0_10px_22px_-10px_rgba(36,91,50,0.8)]'

  let content: React.ReactNode
  if (outOfStock) content = <span>{dict.product.outOfStock}</span>
  else if (state === 'adding')
    content = (
      <>
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>{dict.product.adding}</span>
      </>
    )
  else if (state === 'added' && !buyNow)
    content = (
      <>
        <Check className="h-5 w-5" aria-hidden />
        <span>{dict.product.added}</span>
      </>
    )
  else
    content = (
      <>
        {!buyNow && <ShoppingBag className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:rotate-[-8deg]" aria-hidden />}
        <span>{buyNow ? dict.product.buyNow : dict.product.addToCart}</span>
      </>
    )

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={outOfStock}
        aria-disabled={state === 'adding' || outOfStock}
        aria-busy={state === 'adding'}
        data-testid={buyNow ? 'buy-now' : 'add-to-cart'}
        data-state={outOfStock ? 'out-of-stock' : state}
        className={`${base} ${tone}`}
      >
        {content}
      </button>
      <p role={state === 'error' ? 'alert' : 'status'} aria-live="polite" className={state === 'error' ? 'mt-1.5 text-sm text-danger' : 'sr-only'}>
        {message}
      </p>
    </div>
  )
}

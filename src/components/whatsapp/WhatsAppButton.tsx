'use client'
import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import { useI18n } from '../providers/I18nProvider'
import { useWhatsAppContext } from './whatsapp-store'

const noopSubscribe = () => () => {}

type PageKind = 'home' | 'shop' | 'category' | 'product' | 'cart' | 'checkout' | 'blog' | 'pages' | 'order' | 'other'

function pageKind(pathname: string): PageKind {
  const seg = pathname.split('/')[2] ?? ''
  if (!seg) return 'home'
  const map: Record<string, PageKind> = {
    shop: 'shop',
    category: 'category',
    product: 'product',
    cart: 'cart',
    checkout: 'checkout',
    blog: 'blog',
    pages: 'pages',
    order: 'order',
    'track-order': 'order',
  }
  return map[seg] ?? 'other'
}

/** Original glyph: speech bubble with a phone handset, in WhatsApp green. */
function ChatGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden focusable="false">
      <path
        fill="#fff"
        d="M16 3.2C9 3.2 3.3 8.8 3.3 15.7c0 2.4.7 4.7 2 6.7L3.2 28.8l6.6-2c1.9 1 4 1.6 6.2 1.6 7 0 12.7-5.6 12.7-12.6S23 3.2 16 3.2zm0 22.9c-2 0-3.9-.5-5.5-1.5l-.4-.2-3.9 1.2 1.3-3.8-.3-.4a10.2 10.2 0 0 1-1.6-5.6C5.6 10 10.3 5.5 16 5.5s10.4 4.6 10.4 10.3S21.7 26.1 16 26.1z"
      />
      <path
        fill="#fff"
        d="M21.7 18.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.2 1.4 3.4c.2.2 2.4 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3z"
      />
    </svg>
  )
}

export function WhatsAppButton({
  number,
  messageBn,
  messageEn,
  tooltip,
  position,
  showOn,
}: {
  number: string
  messageBn: string
  messageEn: string
  tooltip?: string | null
  position: 'left' | 'right'
  showOn: string[]
}) {
  const { locale, dict, t } = useI18n()
  const pathname = usePathname() || ''
  const ctx = useWhatsAppContext()
  const kind = pageKind(pathname)
  // The product URL needs the real browser origin, so the button renders client-side only (null during SSR).
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => null)
  if (!origin || !showOn.includes(kind === 'other' ? 'pages' : kind)) return null

  let message = locale === 'bn' ? messageBn : messageEn
  if (kind === 'product' && ctx.productName) {
    // Only the product name and public URL — never customer or checkout data.
    message = t(dict.whatsapp.productMessage, { name: ctx.productName, url: `${origin}${pathname}` })
  } else if (kind === 'cart' || kind === 'checkout') {
    message = dict.whatsapp.cartMessage
  }
  const href = buildWhatsAppUrl(number, message)
  if (!href) return null

  // Pages with a fixed bottom action bar on mobile need the button lifted clear of it.
  const lifted = kind === 'product' || kind === 'cart' || kind === 'checkout'
  const side = position === 'left' ? 'left-4' : 'right-4'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.whatsapp.label}
      data-testid="whatsapp-button"
      className={`wa-in group fixed ${side} z-30 flex items-center gap-2 rounded-full bg-[#1FAF54] p-3 text-white shadow-[0_6px_20px_-6px_rgba(20,80,40,0.6)] transition-transform hover:scale-105 hover:bg-[#1a9a49] focus-visible:outline-offset-4 ${
        lifted ? 'bottom-[calc(88px+env(safe-area-inset-bottom))] md:bottom-6' : 'bottom-[calc(20px+env(safe-area-inset-bottom))] md:bottom-6'
      }`}
    >
      <ChatGlyph />
      {tooltip && <span className="hidden max-w-0 overflow-hidden whitespace-nowrap pr-0 text-sm font-medium transition-all duration-300 group-hover:max-w-56 group-hover:pr-2 md:inline">{tooltip}</span>}
    </a>
  )
}

import Image from 'next/image'
import type { ImageData } from '@/server/queries'

/** Original fallback mark: a ripe mango with a single leaf, drawn to sit beside the wordmark. */
export function MangoMark({ className = 'h-9 w-9', tone = 'color' }: { className?: string; tone?: 'color' | 'light' }) {
  const leaf = tone === 'light' ? '#CFE3B8' : 'var(--color-secondary)'
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <path d="M25.5 9.5c-1.6-4.6 1.4-7.6 6.4-8.3-.5 4.6-2.4 7-6.4 8.3z" fill={leaf} />
      <path d="M24.4 10.2C34.6 10 41.8 17.6 41.4 28.3 41 38.4 33 45 23.7 44.4 13.9 43.8 7.3 36.7 8.6 27.4 9.9 17.8 15.9 10.4 24.4 10.2z" fill="var(--color-accent-warm)" />
      <path d="M24.4 10.2c7.8-.2 13.8 4.3 16 11.2-5.6-4.6-13.7-5.3-20.6-1.5-3.6 2-6.4 5-8.4 8.6 1.2-9.8 6.4-18.1 13-18.3z" fill="var(--color-accent)" opacity=".9" />
      <path d="M17.5 20.5c-3.3 2.3-5 5.7-5.2 9.6" stroke="#FFF4C7" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".85" />
    </svg>
  )
}

export function Logo({
  brandName,
  logo,
  mobileLogo,
  variant = 'header',
}: {
  brandName: string
  logo: ImageData | null
  mobileLogo?: ImageData | null
  variant?: 'header' | 'footer'
}) {
  if (logo) {
    return (
      <>
        <Image
          src={(mobileLogo ?? logo).url}
          alt={brandName}
          width={(mobileLogo ?? logo).width}
          height={(mobileLogo ?? logo).height}
          className={`h-10 w-auto ${mobileLogo ? 'md:hidden' : ''}`}
          priority={variant === 'header'}
        />
        {mobileLogo && <Image src={logo.url} alt={brandName} width={logo.width} height={logo.height} className="hidden h-11 w-auto md:block" priority={variant === 'header'} />}
      </>
    )
  }
  return (
    <span className="flex items-center gap-2.5">
      <MangoMark className={variant === 'footer' ? 'h-10 w-10' : 'h-9 w-9'} tone={variant === 'footer' ? 'light' : 'color'} />
      <span className={`font-display text-[1.45rem] leading-none ${variant === 'footer' ? 'text-cream' : 'text-primary'}`}>{brandName}</span>
    </span>
  )
}

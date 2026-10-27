import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import { localizeHref } from '@/lib/links'
import type { ImageData } from '@/server/queries'

/** Faint leaf-vein texture drawn once as SVG; decorative only. */
function LeafVeins() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 500">
      <g fill="none" stroke="#FFF9ED" strokeWidth="1.4">
        <path d="M-40 520 C 160 360, 300 300, 520 120 S 760 -40, 860 -60" />
        <path d="M120 420 C 160 360, 170 330, 150 280" />
        <path d="M220 360 C 270 320, 300 280, 290 220" />
        <path d="M330 280 C 380 250, 410 210, 410 150" />
        <path d="M440 190 C 490 170, 520 140, 530 90" />
        <path d="M220 360 C 170 350, 130 360, 90 390" />
        <path d="M330 280 C 280 280, 240 300, 210 320" />
        <path d="M440 190 C 400 200, 360 220, 340 250" />
      </g>
    </svg>
  )
}

export function Hero({
  locale,
  headline,
  subheadline,
  image,
  primary,
  secondary,
  badge,
}: {
  locale: Locale
  headline: string
  subheadline?: string | null
  image: ImageData | null
  primary?: { label?: string | null; href?: string | null } | null
  secondary?: { label?: string | null; href?: string | null } | null
  badge?: string | null
}) {
  return (
    <section className="container-page pt-4 md:pt-6" aria-labelledby="hero-title">
      <div className="relative isolate overflow-hidden rounded-[22px] bg-primary text-cream md:rounded-[28px]">
        <LeafVeins />
        <div className="relative grid items-center gap-2 md:grid-cols-[1.05fr_1fr] md:gap-0">
          <div className="relative z-10 px-6 pb-4 pt-10 sm:px-10 md:py-20 lg:py-24 lg:pl-16">
            {badge && (
              <p className="mb-6 inline-flex h-[86px] w-[86px] -rotate-[8deg] items-center justify-center rounded-full bg-accent p-2 text-center text-[0.8rem] font-semibold leading-tight text-ink shadow-[inset_0_0_0_2px_rgba(36,49,38,0.15)] md:absolute md:right-[-12px] md:top-10 md:mb-0 md:h-[104px] md:w-[104px] md:text-[0.9rem]">
                {badge}
              </p>
            )}
            <h1 id="hero-title" className="max-w-[15ch] text-[clamp(2.3rem,6.4vw,4.4rem)] text-cream">
              {headline}
            </h1>
            {subheadline && <p className="mt-5 max-w-[44ch] text-[1.05rem] text-cream/85 md:text-lg">{subheadline}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {primary?.label && (
                <Link
                  href={localizeHref(primary.href || '/category/mango', locale)}
                  className="inline-flex h-12 items-center rounded-[var(--radius-control)] bg-accent px-6 text-base font-semibold text-ink transition-colors hover:bg-[#FFD54F]"
                >
                  {primary.label}
                </Link>
              )}
              {secondary?.label && (
                <Link
                  href={localizeHref(secondary.href || '/shop', locale)}
                  className="inline-flex h-12 items-center rounded-[var(--radius-control)] border border-cream/50 px-6 text-base font-medium text-cream transition-colors hover:border-cream hover:bg-cream/10"
                >
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>
          <div className="relative -mb-2 h-[300px] sm:h-[380px] md:absolute md:inset-y-0 md:right-0 md:mb-0 md:h-auto md:w-[52%]">
            {image && (
              <Image
                src={image.url}
                alt={image.alt}
                fill
                priority
                fetchPriority="high"
                sizes="(min-width: 768px) 52vw, 100vw"
                className="hero-fruit object-contain object-bottom md:object-right-bottom"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

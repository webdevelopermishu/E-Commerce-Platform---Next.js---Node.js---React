import { Clock, HeartHandshake, Leaf, Package, Phone, ShieldCheck, Truck, Wallet, type LucideIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import { localizeHref } from '@/lib/links'
import type { ImageData, ProductCardData } from '@/server/queries'
import { ProductCard, ProductGrid } from '../product/ProductCard'

const ICONS: Record<string, LucideIcon> = {
  leaf: Leaf,
  package: Package,
  truck: Truck,
  wallet: Wallet,
  shield: ShieldCheck,
  phone: Phone,
  clock: Clock,
  heart: HeartHandshake,
}

export function SectionHeading({ id, title, intro, action }: { id: string; title: string; intro?: string | null; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 md:mb-9">
      <div>
        <h2 id={id} className="text-[clamp(1.7rem,3.4vw,2.5rem)] text-primary">
          {title}
        </h2>
        {intro && <p className="mt-2 max-w-[60ch] text-ink-soft">{intro}</p>}
      </div>
      {action}
    </div>
  )
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary underline decoration-accent-warm decoration-2 underline-offset-[6px] hover:decoration-primary">
      {children}
    </Link>
  )
}

export function Benefits({ items }: { items: { icon?: string | null; title: string; text?: string | null }[] }) {
  if (!items.length) return null
  return (
    <section aria-label="Benefits" className="container-page mt-10 md:mt-12">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 border-y border-line py-6 md:grid-cols-4 md:divide-x md:divide-line md:py-7">
        {items.map((b) => {
          const Icon = ICONS[b.icon ?? 'leaf'] ?? Leaf
          return (
            <li key={b.title} className="flex items-start gap-3 md:px-5 md:first:pl-0">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-tint text-secondary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold leading-snug">{b.title}</p>
                {b.text && <p className="mt-0.5 text-sm text-ink-soft">{b.text}</p>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export interface CategoryTile {
  slug: string
  name: string
  description?: string | null
  image: ImageData | null
}

/** The first category (mangoes) gets the large tile so the flagship reads as flagship. */
export function CategoryTiles({ locale, title, tiles, viewAll }: { locale: Locale; title: string; tiles: CategoryTile[]; viewAll: string }) {
  if (!tiles.length) return null
  const [lead, ...rest] = tiles
  const grid = rest.slice(0, 4)
  const extra = rest.slice(4)
  return (
    <section className="container-page mt-16 md:mt-24" aria-labelledby="cats-title">
      <SectionHeading id="cats-title" title={title} action={<TextLink href={`/${locale}/shop`}>{viewAll}</TextLink>} />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 lg:grid-rows-2">
        {lead && (
          <Link
            href={`/${locale}/category/${lead.slug}`}
            className="group relative col-span-2 flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-mango-tint p-5 lg:row-span-2 lg:min-h-[460px] lg:p-8"
          >
            {lead.image && (
              <Image src={lead.image.url} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" aria-hidden />
            <span className="relative">
              <span className="block font-display text-4xl text-cream lg:text-5xl">{lead.name}</span>
              {lead.description && <span className="mt-2 block max-w-[40ch] text-cream/90">{lead.description}</span>}
            </span>
          </Link>
        )}
        {grid.map((c) => (
          <Link key={c.slug} href={`/${locale}/category/${c.slug}`} className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-paper ring-1 ring-line transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(36,49,38,0.5)]">
            <span className="relative block aspect-[4/3] bg-leaf-tint">
              {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
            </span>
            <span className="block px-4 py-3">
              <span className="block font-semibold text-ink group-hover:text-primary">{c.name}</span>
              {c.description && <span className="mt-0.5 line-clamp-1 block text-sm text-ink-soft">{c.description}</span>}
            </span>
          </Link>
        ))}
      </div>
      {/* Categories beyond the 1 + 4 mosaic become wide cards, so any number of categories lays out without orphans. */}
      {extra.length > 0 && (
        <div className={`mt-3 grid gap-3 md:mt-4 md:gap-4 ${extra.length > 1 ? 'md:grid-cols-2' : ''} ${extra.length > 2 ? 'lg:grid-cols-3' : ''}`}>
          {extra.map((c) => (
            <Link key={c.slug} href={`/${locale}/category/${c.slug}`} className="group flex items-center overflow-hidden rounded-[var(--radius-card)] bg-paper ring-1 ring-line transition-shadow hover:shadow-[0_10px_30px_-18px_rgba(36,49,38,0.5)]">
              <span className={`relative block aspect-[4/3] shrink-0 bg-leaf-tint ${extra.length === 1 ? 'w-2/5 sm:w-1/4' : 'w-2/5'}`}>
                {c.image && <Image src={c.image.url} alt="" fill sizes="(min-width:1024px) 25vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
              </span>
              <span className="flex flex-1 items-center justify-between gap-4 px-5 py-4 sm:px-8">
                <span>
                  <span className="block font-display text-xl text-ink group-hover:text-primary sm:text-2xl">{c.name}</span>
                  {c.description && <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">{c.description}</span>}
                </span>
                <span aria-hidden className="hidden text-2xl text-secondary transition-transform group-hover:translate-x-1 sm:block">→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export function ProductsSection({
  id,
  locale,
  dict,
  title,
  intro,
  products,
  cta,
  tone = 'plain',
}: {
  id: string
  locale: Locale
  dict: Dictionary
  title: string
  intro?: string | null
  products: ProductCardData[]
  cta?: { label: string; href: string } | null
  tone?: 'plain' | 'leaf'
}) {
  if (!products.length) return null
  const inner = (
    <div className="container-page">
      <SectionHeading id={id} title={title} intro={intro} action={cta ? <TextLink href={cta.href}>{cta.label}</TextLink> : undefined} />
      <ProductGrid products={products} locale={locale} dict={dict} />
    </div>
  )
  return tone === 'leaf' ? (
    <section className="mt-16 bg-leaf-tint py-14 md:mt-24 md:py-20" aria-labelledby={id}>
      {inner}
    </section>
  ) : (
    <section className="mt-16 md:mt-24" aria-labelledby={id}>
      {inner}
    </section>
  )
}

/** One row per traditional-food category; scrolls sideways on phones. */
export function CategoryRows({
  locale,
  dict,
  title,
  intro,
  rows,
}: {
  locale: Locale
  dict: Dictionary
  title: string
  intro?: string | null
  rows: { slug: string; name: string; products: ProductCardData[] }[]
}) {
  const visible = rows.filter((r) => r.products.length)
  if (!visible.length) return null
  return (
    <section className="container-page mt-16 md:mt-24" aria-labelledby="trad-title">
      <SectionHeading id="trad-title" title={title} intro={intro} />
      <div className="space-y-12">
        {visible.map((r) => (
          <div key={r.slug}>
            <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <h3 className="font-display text-2xl text-ink">{r.name}</h3>
              <TextLink href={`/${locale}/category/${r.slug}`}>{dict.common.viewAll}</TextLink>
            </div>
            <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 xl:grid-cols-4">
              {r.products.map((p) => (
                <li key={p.id} className="w-[46vw] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none">
                  <ProductCard product={p} locale={locale} dict={dict} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PromoBanner({ locale, heading, text, image, cta }: { locale: Locale; heading: string; text?: string | null; image: ImageData | null; cta?: { label?: string | null; href?: string | null } | null }) {
  return (
    <section className="container-page mt-16 md:mt-24" aria-labelledby="promo-title">
      <div className="grid overflow-hidden rounded-[22px] bg-accent md:grid-cols-2">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <h2 id="promo-title" className="text-[clamp(1.8rem,3.6vw,2.8rem)] text-ink">
            {heading}
          </h2>
          {text && <p className="mt-3 max-w-[46ch] text-ink/80">{text}</p>}
          {cta?.label && (
            <Link href={localizeHref(cta.href || '/shop', locale)} className="mt-7 inline-flex h-12 w-fit items-center rounded-[var(--radius-control)] bg-primary px-6 font-semibold text-white hover:bg-primary-deep">
              {cta.label}
            </Link>
          )}
        </div>
        <div className="relative min-h-[240px] md:min-h-[360px]">
          {image && <Image src={image.url} alt={image.alt} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />}
        </div>
      </div>
    </section>
  )
}

export function StorySection({ locale, heading, body, image, cta }: { locale: Locale; heading: string; body: string; image: ImageData | null; cta?: { label?: string | null; href?: string | null } | null }) {
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  return (
    <section className="container-page mt-16 md:mt-28" aria-labelledby="story-title">
      <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-leaf-tint md:col-span-5">
          {image && <Image src={image.url} alt={image.alt} fill sizes="(min-width:768px) 40vw, 100vw" className="object-cover" />}
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <h2 id="story-title" className="text-[clamp(1.9rem,3.8vw,3rem)] text-primary">
            {heading}
          </h2>
          <div className="mt-5 space-y-4 text-[1.05rem] text-ink/90">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          {cta?.label && (
            <p className="mt-7">
              <TextLink href={localizeHref(cta.href || '/pages/our-story', locale)}>{cta.label}</TextLink>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export function Testimonials({ title, items }: { title: string; items: { id: number; customerName: string; location?: string | null; quote: string; rating?: number | null }[] }) {
  if (!items.length) return null
  return (
    <section className="container-page mt-16 md:mt-24" aria-labelledby="reviews-title">
      <SectionHeading id="reviews-title" title={title} />
      <ul className="grid gap-5 md:grid-cols-3">
        {items.map((r) => (
          <li key={r.id}>
            <figure className="flex h-full flex-col border-l-2 border-accent-warm pl-5">
              {r.rating ? (
                <p className="text-accent-warm" aria-label={`${r.rating}/5`}>
                  {'★'.repeat(r.rating)}
                  <span className="text-line">{'★'.repeat(5 - r.rating)}</span>
                </p>
              ) : null}
              <blockquote className="mt-2 flex-1 font-display text-xl leading-relaxed text-ink">“{r.quote}”</blockquote>
              <figcaption className="mt-4 text-sm text-ink-soft">
                {r.customerName}
                {r.location ? `, ${r.location}` : ''}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FaqList({ title, items, headingId = 'faq-title' }: { title: string; items: { id: number; question: string; answer: string }[]; headingId?: string }) {
  if (!items.length) return null
  return (
    <section className="container-page mt-16 md:mt-24" aria-labelledby={headingId}>
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 id={headingId} className="text-[clamp(1.7rem,3.4vw,2.5rem)] text-primary">
            {title}
          </h2>
        </div>
        <div className="divide-y divide-line border-y border-line md:col-span-8">
          {items.map((f) => (
            <details key={f.id} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[1.05rem] font-semibold marker:hidden">
                {f.question}
                <span aria-hidden className="text-2xl leading-none text-secondary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="whitespace-pre-line pb-5 pr-8 text-ink/85">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

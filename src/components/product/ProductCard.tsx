import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import { interpolate } from '@/lib/i18n/format'
import type { ProductCardData } from '@/server/queries'
import { ProductCardActions } from './ProductCardActions'

export function ProductCard({ product, locale, dict, priority = false }: { product: ProductCardData; locale: Locale; dict: Dictionary; priority?: boolean }) {
  const href = `/${locale}/product/${product.slug}`
  const anyStock = product.variants.some((v) => v.stock > 0)
  const best = Math.max(0, ...product.variants.map((v) => v.discountPercent))
  // Honest badge: if not every pack size carries the same discount, say "up to".
  const uniform = product.variants.every((v) => v.discountPercent === best)
  return (
    <article className="group relative flex h-full flex-col" data-testid="product-card">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-[var(--radius-card)] bg-mango-tint" aria-label={interpolate(dict.product.viewProduct, { name: product.name })}>
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            sizes="(min-width:1280px) 300px, (min-width:768px) 30vw, 48vw"
            priority={priority}
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.035] ${anyStock ? '' : 'opacity-60 grayscale-[35%]'}`}
          />
        ) : null}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {!anyStock && <span className="rounded-[6px] bg-ink/85 px-2 py-0.5 text-xs font-medium text-cream">{dict.product.outOfStock}</span>}
          {anyStock && best > 0 && (
            <span className="rounded-[6px] bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
              {interpolate(uniform ? dict.product.off : dict.product.offUpTo, { percent: locale === 'bn' ? best.toLocaleString('bn-BD') : best })}
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col pt-3">
        <h3 className="font-sans text-[1.05rem] font-semibold leading-snug text-ink">
          <Link href={href} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.shortDescription}</p>}
        <ProductCardActions product={{ id: product.id, slug: product.slug, name: product.name, imageUrl: product.image?.url ?? null }} variants={product.variants} />
      </div>
    </article>
  )
}

export function ProductGrid({ products, locale, dict, priorityCount = 0 }: { products: ProductCardData[]; locale: Locale; dict: Dictionary; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} locale={locale} dict={dict} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}

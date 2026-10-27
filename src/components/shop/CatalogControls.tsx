'use client'
import { Search, SlidersHorizontal } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { useI18n } from '../providers/I18nProvider'

/**
 * Filter + sort form. Plain GET form (works without JavaScript); with JS it updates the URL instantly.
 * Prices are typed in taka and converted to poisha on the server.
 */
export function CatalogControls({ categories, activeCategory, basePath }: { categories: { slug: string; name: string }[]; activeCategory?: string; basePath: string }) {
  const { dict } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)

  const submit = () => {
    const fd = new FormData(formRef.current!)
    const qs = new URLSearchParams()
    for (const [k, v] of fd.entries()) if (typeof v === 'string' && v.trim() && k !== 'category') qs.set(k, v.trim())
    const cat = fd.get('category')
    const target = typeof cat === 'string' && cat ? `${basePath.replace(/\/shop$/, '')}/category/${cat}` : basePath
    start(() => router.push(`${cat === (activeCategory ?? '') ? pathname : target}${qs.size ? `?${qs}` : ''}`))
  }

  const field = 'h-10 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm'
  return (
    <form
      ref={formRef}
      method="get"
      action={pathname}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="mb-8"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Search works in both languages: products store Bangla + English names and tags in a search field. */}
        <div role="search" className="relative order-first w-full sm:w-auto sm:min-w-72 sm:flex-1 md:max-w-md">
          <label htmlFor="catalog-q" className="sr-only">
            {dict.common.search}
          </label>
          <input
            key={sp.get('q') ?? ''}
            id="catalog-q"
            name="q"
            type="search"
            defaultValue={sp.get('q') ?? ''}
            placeholder={dict.common.searchPlaceholder}
            enterKeyHint="search"
            className={`${field} pl-9`}
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="catalog-filters"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-paper px-3 text-sm md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> {dict.shop.filters}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="sort" className="whitespace-nowrap text-sm text-ink-soft">
            {dict.shop.sort}
          </label>
          <select id="sort" name="sort" defaultValue={sp.get('sort') ?? 'featured'} onChange={submit} className={`${field} w-auto`}>
            <option value="featured">{dict.shop.sortFeatured}</option>
            <option value="newest">{dict.shop.sortNewest}</option>
            <option value="price_asc">{dict.shop.sortPriceAsc}</option>
            <option value="price_desc">{dict.shop.sortPriceDesc}</option>
          </select>
        </div>
      </div>

      <div id="catalog-filters" className={`${open ? 'grid' : 'hidden'} mt-4 gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-4 sm:grid-cols-2 md:grid md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end md:border-0 md:bg-transparent md:p-0`}>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            {dict.shop.category}
          </label>
          <select id="category" name="category" defaultValue={activeCategory ?? ''} onChange={submit} className={field}>
            <option value="">{dict.shop.allCategories}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="mb-1 text-sm font-medium">{dict.shop.price}</legend>
          <label className="sr-only" htmlFor="min">
            {dict.shop.min}
          </label>
          <input id="min" name="min" inputMode="numeric" pattern="[0-9]*" placeholder={dict.shop.min} defaultValue={sp.get('min') ?? ''} className={field} />
          <label className="sr-only" htmlFor="max">
            {dict.shop.max}
          </label>
          <input id="max" name="max" inputMode="numeric" pattern="[0-9]*" placeholder={dict.shop.max} defaultValue={sp.get('max') ?? ''} className={field} />
        </fieldset>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="stock" value="1" defaultChecked={sp.get('stock') === '1'} onChange={submit} className="h-4 w-4 accent-[var(--color-primary)]" />
          {dict.shop.inStockOnly}
        </label>
        <button type="submit" className="h-10 rounded-[var(--radius-control)] bg-primary px-5 text-sm font-medium text-white hover:bg-primary-deep">
          {dict.shop.apply}
        </button>
      </div>
    </form>
  )
}

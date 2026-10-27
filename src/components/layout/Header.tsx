import { Search } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Dictionary } from '@/lib/i18n/dictionaries/en'
import type { Locale } from '@/lib/i18n/config'
import { localizeHref } from '@/lib/links'
import type { ImageData } from '@/server/queries'
import { CartButton } from './CartButton'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { MobileMenu, type NavLink } from './MobileMenu'

export function Header({
  locale,
  dict,
  brandName,
  logo,
  mobileLogo,
  links,
}: {
  locale: Locale
  dict: Dictionary
  brandName: string
  logo: ImageData | null
  mobileLogo: ImageData | null
  links: { label: string; href: string }[]
}) {
  const nav: NavLink[] = (
    links.length
      ? links
      : [
          { label: dict.nav.home, href: '/' },
          { label: dict.nav.shop, href: '/shop' },
          { label: dict.nav.mangoes, href: '/category/mango' },
          { label: dict.nav.blog, href: '/blog' },
          { label: dict.nav.trackOrder, href: '/track-order' },
        ]
  ).map((l) => ({ label: l.label, href: localizeHref(l.href, locale) }))
  const searchAction = `/${locale}/shop`

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85">
      <div className="container-page flex h-16 items-center gap-2 md:h-[72px] md:gap-4">
        <Suspense fallback={<span className="h-11 w-11 xl:hidden" />}>
          <MobileMenu links={nav} searchAction={searchAction} />
        </Suspense>
        <Link href={`/${locale}`} className="mr-auto flex shrink-0 items-center xl:mr-4" aria-label={`${brandName} — ${dict.nav.home}`}>
          <Logo brandName={brandName} logo={logo} mobileLogo={mobileLogo} />
        </Link>

        <nav aria-label={dict.common.menu} className="hidden min-w-0 flex-1 xl:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="whitespace-nowrap rounded-[var(--radius-control)] px-2.5 py-2 text-[0.95rem] text-ink hover:bg-leaf-tint hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form action={searchAction} method="get" role="search" className="relative hidden 2xl:block">
          <label htmlFor="header-search" className="sr-only">
            {dict.common.search}
          </label>
          <input
            id="header-search"
            name="q"
            type="search"
            placeholder={dict.common.searchPlaceholder}
            className="h-10 w-44 rounded-[var(--radius-control)] border border-line bg-paper pl-9 pr-3 text-sm placeholder:text-ink-soft focus:w-60 focus:outline-none focus:ring-2 focus:ring-secondary xl:w-56"
          />
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
        </form>
        <Link href={searchAction} aria-label={dict.common.search} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-primary hover:bg-leaf-tint 2xl:hidden">
          <Search className="h-5 w-5" aria-hidden />
        </Link>

        <Suspense fallback={null}>
          <LanguageSwitcher className="hidden sm:flex" />
        </Suspense>
        <CartButton />
      </div>
    </header>
  )
}

'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useI18n } from '../providers/I18nProvider'
import { LanguageSwitcher } from './LanguageSwitcher'

export interface NavLink {
  label: string
  href: string
}

export function MobileMenu({ links, searchAction }: { links: NavLink[]; searchAction: string }) {
  const [open, setOpen] = useState(false)
  const { dict } = useI18n()
  const pathname = usePathname()
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label={dict.common.openMenu} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-primary hover:bg-leaf-tint xl:hidden">
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col bg-cream p-5 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="font-display text-xl text-primary">{dict.common.menu}</Dialog.Title>
            <Dialog.Close aria-label={dict.common.close} className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] hover:bg-leaf-tint">
              <X className="h-6 w-6" aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{dict.common.menu}</Dialog.Description>
          <form action={searchAction} method="get" role="search" className="mt-4">
            <label className="sr-only" htmlFor="mobile-search">
              {dict.common.search}
            </label>
            <input
              id="mobile-search"
              name="q"
              type="search"
              placeholder={dict.common.searchPlaceholder}
              className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3"
            />
          </form>
          <nav aria-label={dict.common.menu} className="mt-4 flex-1 overflow-y-auto">
            <ul className="divide-y divide-line">
              {links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="block py-3.5 text-lg text-ink hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher className="mt-4 self-start" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

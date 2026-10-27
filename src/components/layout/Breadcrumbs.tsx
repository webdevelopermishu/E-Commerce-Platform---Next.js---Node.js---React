import Link from 'next/link'
import { JsonLdScript } from '../seo/JsonLdScript'
import { breadcrumbLd } from '@/lib/seo/jsonld'

export function Breadcrumbs({ items, baseUrl, label }: { items: { name: string; href: string }[]; baseUrl: string; label: string }) {
  return (
    <>
      <nav aria-label={label} className="text-sm text-ink-soft">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((it, i) => (
            <li key={it.href} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-ink">
                  {it.name}
                </span>
              ) : (
                <Link href={it.href} className="hover:text-primary hover:underline">
                  {it.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLdScript data={breadcrumbLd(items.map((it) => ({ name: it.name, url: `${baseUrl}${it.href}` })))} />
    </>
  )
}

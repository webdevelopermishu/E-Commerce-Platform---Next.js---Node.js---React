import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'
import { getDictionary } from '@/lib/i18n'
import { resolveLocale } from '@/server/page-helpers'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  return { title: getDictionary(locale).seo.cartTitle, robots: { index: false, follow: true } }
}

export default async function CartPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const dict = getDictionary(locale)
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="mb-8 text-[clamp(2rem,4vw,3rem)] text-primary">{dict.cart.title}</h1>
      <CartView />
    </div>
  )
}

import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { getDictionary } from '@/lib/i18n'
import { loadDeliveryConfig } from '@/server/catalog-pricing'
import { resolveLocale } from '@/server/page-helpers'
import { getPayloadClient } from '@/server/payload'
import { getEnabledPaymentMethods } from '@/server/payments/registry'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params)
  return { title: getDictionary(locale).seo.checkoutTitle, robots: { index: false, follow: false } }
}

export default async function CheckoutPage({ params }: Props) {
  const locale = await resolveLocale(params)
  const dict = getDictionary(locale)
  const payload = await getPayloadClient()
  const [delivery, payments, settings] = await Promise.all([
    loadDeliveryConfig(payload, locale),
    getEnabledPaymentMethods(payload),
    payload.findGlobal({ slug: 'payment-settings', locale, depth: 0, overrideAccess: true }),
  ])
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="mb-8 text-[clamp(2rem,4vw,3rem)] text-primary">{dict.checkout.title}</h1>
      <CheckoutForm
        options={{
          methods: delivery.methods.map((m) => ({ code: m.code, name: m.name, description: m.description, surcharge: m.surcharge })),
          payments: payments.map((p) => ({ id: p.id, label: p.label[locale], maxTotal: p.maxTotal })),
          note: settings.checkoutNote,
        }}
      />
    </div>
  )
}

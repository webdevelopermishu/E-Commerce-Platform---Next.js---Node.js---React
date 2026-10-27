import type { Payload } from 'payload'
import { bkash } from './bkash'
import { nagad } from './nagad'
import { sslcommerz } from './sslcommerz'
import type { GatewayId, PaymentGateway, PaymentMethodId } from './types'

export const gateways: Record<GatewayId, PaymentGateway> = { sslcommerz, bkash, nagad }

export interface EnabledPaymentMethod {
  id: PaymentMethodId
  label: { bn: string; en: string }
  /** COD limit (poisha) — null means no limit. */
  maxTotal: number | null
}

/** A method is offered only when switched on in admin AND (for gateways) its credentials exist on the server. */
export async function getEnabledPaymentMethods(payload: Payload): Promise<EnabledPaymentMethod[]> {
  const s = await payload.findGlobal({ slug: 'payment-settings', depth: 0, overrideAccess: true })
  const out: EnabledPaymentMethod[] = []
  if (s.codEnabled !== false) {
    out.push({ id: 'cod', label: { bn: 'ক্যাশ অন ডেলিভারি', en: 'Cash on delivery' }, maxTotal: s.codMaxTotal || null })
  }
  const flags: Record<GatewayId, boolean> = {
    sslcommerz: Boolean(s.sslcommerzEnabled),
    bkash: Boolean(s.bkashEnabled),
    nagad: Boolean(s.nagadEnabled),
  }
  for (const g of Object.values(gateways)) {
    if (flags[g.id] && g.isConfigured()) out.push({ id: g.id, label: g.label, maxTotal: null })
  }
  return out
}

import type { Poisha } from './money'

export interface DeliveryZone {
  code: string
  fee: Poisha
  /** Free delivery when merchandise subtotal (after discount) reaches this amount. 0/null = never free. */
  freeOver?: Poisha | null
  /** District codes this zone serves. Empty = fallback zone. */
  districts?: string[] | null
  isDefault?: boolean | null
  enabled?: boolean | null
}

export interface DeliveryMethod {
  code: string
  /** Added on top of zone fee (e.g. express). */
  surcharge: Poisha
  enabled?: boolean | null
}

/** Pick the zone for a district: an explicit match wins, otherwise the default zone. */
export function resolveZone(zones: DeliveryZone[], district: string | null | undefined): DeliveryZone | null {
  const active = zones.filter((z) => z.enabled !== false)
  if (district) {
    const match = active.find((z) => z.districts?.includes(district))
    if (match) return match
  }
  return active.find((z) => z.isDefault) ?? null
}

export function deliveryFee(
  zone: DeliveryZone | null,
  method: DeliveryMethod | null,
  discountedSubtotal: Poisha,
): Poisha {
  if (!zone) return 0
  const free = zone.freeOver != null && zone.freeOver > 0 && discountedSubtotal >= zone.freeOver
  const base = free ? 0 : zone.fee
  return base + (method?.surcharge ?? 0)
}

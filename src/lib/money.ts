/**
 * Money is stored and computed as integer **poisha** (1 ৳ = 100 poisha).
 * Never use floating point for totals. All helpers here guard against non-integers.
 */

export type Poisha = number

export const POISHA_PER_TAKA = 100

export function assertPoisha(value: number, label = 'amount'): Poisha {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer number of poisha, received ${value}`)
  }
  return value
}

/** Convert a taka value typed by a human ("450", "450.5", 450.75) to integer poisha. */
export function takaToPoisha(input: string | number): Poisha {
  const str = typeof input === 'number' ? input.toString() : input.trim().replace(/,/g, '')
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new Error(`Invalid taka amount: "${input}"`)
  }
  const negative = str.startsWith('-')
  const [whole, frac = ''] = str.replace('-', '').split('.')
  const poisha = Number(whole) * POISHA_PER_TAKA + Number(frac.padEnd(2, '0'))
  return negative ? -poisha : poisha
}

/** Convert integer poisha into a taka string with up to 2 decimals and no float drift ("450", "450.50"). */
export function poishaToTakaString(poisha: Poisha): string {
  assertPoisha(poisha)
  const negative = poisha < 0
  const abs = Math.abs(poisha)
  const whole = Math.floor(abs / POISHA_PER_TAKA)
  const frac = abs % POISHA_PER_TAKA
  const body = frac === 0 ? `${whole}` : `${whole}.${frac.toString().padStart(2, '0')}`
  return negative ? `-${body}` : body
}

/** Multiply a unit price by an integer quantity. */
export function multiply(unit: Poisha, quantity: number): Poisha {
  assertPoisha(unit, 'unit price')
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error('quantity must be a non-negative integer')
  return unit * quantity
}

/**
 * Percentage of an amount, rounded half-up to the nearest poisha.
 * Uses basis points (1% = 100 bp) to keep the computation integer-only.
 */
export function percentOf(amount: Poisha, percent: number): Poisha {
  assertPoisha(amount)
  const bp = Math.round(percent * 100)
  if (bp < 0 || bp > 10000) throw new Error('percent must be between 0 and 100')
  return Math.floor((amount * bp + 5000) / 10000)
}

export function sum(values: Poisha[]): Poisha {
  return values.reduce((acc, v) => acc + assertPoisha(v), 0)
}

export function clamp(value: Poisha, min: Poisha, max: Poisha): Poisha {
  return Math.min(Math.max(value, min), max)
}

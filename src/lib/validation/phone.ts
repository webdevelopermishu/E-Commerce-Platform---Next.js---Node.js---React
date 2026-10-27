const bnDigits = '০১২৩৪৫৬৭৮৯'

/** Convert Bengali digits to ASCII so customers can type in either script. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[০-৯]/g, (ch) => String(bnDigits.indexOf(ch)))
}

/**
 * Normalize a Bangladeshi mobile number to the 11-digit local form `01XXXXXXXXX`.
 * Accepts +8801…, 8801…, 01…, spaces and dashes, and Bengali digits.
 * Returns null when it is not a valid mobile number (operator prefixes 013–019).
 */
export function normalizeBdPhone(input: string): string | null {
  let digits = toAsciiDigits(input).replace(/[\s\-().]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('880')) digits = digits.slice(2)
  if (!/^01[3-9]\d{8}$/.test(digits)) return null
  return digits
}

/** E.164 without the plus (for wa.me / SMS providers): 8801XXXXXXXXX */
export function toInternational(local: string): string {
  return `88${local}`
}

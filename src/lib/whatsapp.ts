/**
 * Build a click-to-chat URL. Never put addresses, payment details or other checkout data in here.
 * `phone` must contain the country code; any non-digits are stripped.
 */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  const text = message.trim()
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

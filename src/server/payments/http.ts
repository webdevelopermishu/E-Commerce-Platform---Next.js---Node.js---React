import { GatewayError } from './types'

/** fetch with timeout and JSON parsing; gateway errors never leak credentials into messages. */
export async function requestJson<T>(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 20_000)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
    const text = await res.text()
    let body: unknown
    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      throw new GatewayError(`Gateway returned non-JSON response (HTTP ${res.status})`)
    }
    if (!res.ok) throw new GatewayError(`Gateway HTTP ${res.status}`, body)
    return body as T
  } catch (err) {
    if (err instanceof GatewayError) throw err
    throw new GatewayError(err instanceof Error && err.name === 'AbortError' ? 'Gateway request timed out' : 'Gateway request failed')
  } finally {
    clearTimeout(timer)
  }
}

/** "1250.00" → 125000 poisha. Returns undefined for unparsable values. */
export function gatewayAmountToPoisha(v: unknown): number | undefined {
  if (typeof v !== 'string' && typeof v !== 'number') return undefined
  const s = String(v).trim()
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return undefined
  const [w, f = ''] = s.split('.')
  return Number(w) * 100 + Number(f.padEnd(2, '0'))
}

export function poishaToGatewayAmount(poisha: number): string {
  return `${Math.floor(poisha / 100)}.${String(poisha % 100).padStart(2, '0')}`
}

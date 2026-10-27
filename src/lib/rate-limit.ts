/**
 * Fixed-window, in-memory rate limiter.
 * Suitable for a single Node process (PM2 fork mode / one container). If you run several
 * instances behind a load balancer, swap this for a shared store (e.g. Redis) — the interface is tiny.
 */
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    lastSweep = now
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  bucket.count += 1
  const ok = bucket.count <= limit
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  }
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear()
}

/**
 * Client IP for rate limiting, as reported by OUR reverse proxy.
 * The bundled Nginx config overwrites X-Real-IP with $remote_addr, so it cannot be forged by the client.
 * Without it we take the RIGHTMOST X-Forwarded-For hop (the one appended by the proxy) — the leftmost
 * entries are client-supplied and would let anyone dodge limits by sending a fake header.
 */
export function clientIpFromHeaders(h: Headers): string {
  const real = h.get('x-real-ip')?.trim()
  if (real) return real
  const xff = h.get('x-forwarded-for')
  if (xff) {
    const hops = xff.split(',').map((s) => s.trim()).filter(Boolean)
    if (hops.length) return hops[hops.length - 1]!
  }
  return 'unknown'
}

import { NextResponse, type NextRequest } from 'next/server'
import { clientIpFromHeaders, rateLimit } from '@/lib/rate-limit'
import { env } from '@/server/env'
import { getPayloadClient } from '@/server/payload'
import { executeBkash } from '@/server/payments/bkash'
import { verifyNagad } from '@/server/payments/nagad'
import { applyVerification, findPayment } from '@/server/payments/service'
import { verifySslcommerz } from '@/server/payments/sslcommerz'
import type { VerifyResult } from '@/server/payments/types'

export const dynamic = 'force-dynamic'

/**
 * Customers return here from the gateway. Nothing in the query/body is trusted as proof of payment:
 * every success is re-verified server-to-server with the gateway before the order is marked paid.
 */
async function handle(req: NextRequest, provider: string): Promise<NextResponse> {
  const ip = clientIpFromHeaders(req.headers)
  if (!rateLimit(`pay-cb:${ip}`, 30, 60_000).ok) return new NextResponse('Too many requests', { status: 429 })

  const url = req.nextUrl
  const form = req.method === 'POST' ? await req.formData().catch(() => null) : null
  const param = (k: string) => (form?.get(k) as string | null) ?? url.searchParams.get(k) ?? undefined
  const home = `${env.NEXT_PUBLIC_SERVER_URL}/bn`

  try {
    const payload = await getPayloadClient()
    let result: VerifyResult
    let payment

    if (provider === 'sslcommerz') {
      payment = await findPayment(payload, { reference: param('ref') ?? param('tran_id') })
      if (!payment) return NextResponse.redirect(home, 303)
      const valId = param('val_id')
      const outcome = url.searchParams.get('result')
      if (valId) result = await verifySslcommerz(valId)
      else result = { status: outcome === 'cancel' ? 'cancelled' : 'failed', reason: `Customer returned via ${outcome ?? 'unknown'} URL` }
    } else if (provider === 'bkash') {
      const paymentID = param('paymentID')
      payment = await findPayment(payload, { gatewayPaymentId: paymentID })
      if (!payment || !paymentID) return NextResponse.redirect(home, 303)
      const status = param('status')
      result = status === 'success' ? await executeBkash(paymentID) : { status: status === 'cancel' ? 'cancelled' : 'failed', reason: `bKash status ${status}` }
    } else if (provider === 'nagad') {
      const ref = param('payment_ref_id')
      payment = await findPayment(payload, { gatewayPaymentId: ref })
      if (!payment || !ref) return NextResponse.redirect(home, 303)
      result = await verifyNagad(ref)
    } else {
      return new NextResponse('Not found', { status: 404 })
    }

    const target = await applyVerification(payload, payment, result)
    return NextResponse.redirect(target, 303)
  } catch (err) {
    console.error('Payment callback error', provider, err instanceof Error ? err.message : err)
    return NextResponse.redirect(home, 303)
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  return handle(req, (await ctx.params).provider)
}

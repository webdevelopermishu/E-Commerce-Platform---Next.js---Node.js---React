import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '@/server/payload'
import { applyVerification, findPayment } from '@/server/payments/service'
import { verifySslcommerz } from '@/server/payments/sslcommerz'

export const dynamic = 'force-dynamic'

/** SSLCommerz Instant Payment Notification (server-to-server). Always re-validated via the validation API. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const valId = form?.get('val_id') as string | null
  const tranId = (form?.get('tran_id') as string | null) ?? req.nextUrl.searchParams.get('ref')
  if (!valId || !tranId) return new NextResponse('ignored', { status: 200 })
  try {
    const payload = await getPayloadClient()
    const payment = await findPayment(payload, { reference: tranId })
    if (!payment) return new NextResponse('unknown transaction', { status: 200 })
    await applyVerification(payload, payment, await verifySslcommerz(valId))
    return new NextResponse('ok', { status: 200 })
  } catch (err) {
    console.error('SSLCommerz IPN error', err instanceof Error ? err.message : err)
    return new NextResponse('error', { status: 500 })
  }
}

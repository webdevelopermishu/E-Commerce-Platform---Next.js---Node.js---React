import crypto from 'crypto'
import { env } from '../env'
import { gatewayAmountToPoisha, poishaToGatewayAmount, requestJson } from './http'
import { GatewayError, type InitiateParams, type InitiateResult, type PaymentGateway, type VerifyResult } from './types'

/**
 * Nagad Online Payment (merchant checkout, API v-0.2.0).
 *   1. POST {base}/check-out/initialize/{merchantId}/{orderId}
 *        sensitiveData = RSA(PG public key)  { merchantId, datetime, orderId, challenge }
 *        signature     = SHA256withRSA(merchant private key) over the same JSON
 *      → response.sensitiveData decrypted with merchant private key → { paymentReferenceId, challenge }
 *   2. POST {base}/check-out/complete/{paymentReferenceId}
 *        sensitiveData { merchantId, orderId, currencyCode: "050", amount, challenge } + merchantCallbackURL
 *      → { status: "Success", callBackUrl }  (redirect the customer there)
 *   3. Customer returns to our callback with ?payment_ref_id=…&status=…; we call
 *      GET {base}/verify/payment/{payment_ref_id} and trust only that response.
 *
 * IMPORTANT: confirm the base URL, API version and key formats against the documentation Nagad provides
 * with your merchant account, and test end-to-end in their sandbox before enabling in production.
 */
const base = () =>
  env.NAGAD_BASE_URL ||
  (env.PAYMENTS_SANDBOX ? 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs' : 'https://api.mynagad.com/api/dfs')

function pem(key: string, type: 'PUBLIC' | 'PRIVATE'): string {
  const k = key.replace(/\\n/g, '\n').trim()
  if (k.includes('BEGIN')) return k
  const body = k.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? k
  return `-----BEGIN ${type} KEY-----\n${body}\n-----END ${type} KEY-----`
}

const encrypt = (data: object) =>
  crypto.publicEncrypt({ key: pem(env.NAGAD_PG_PUBLIC_KEY!, 'PUBLIC'), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(data))).toString('base64')

const sign = (data: object) => crypto.sign('sha256', Buffer.from(JSON.stringify(data)), pem(env.NAGAD_MERCHANT_PRIVATE_KEY!, 'PRIVATE')).toString('base64')

const decrypt = (b64: string) =>
  JSON.parse(
    crypto.privateDecrypt({ key: pem(env.NAGAD_MERCHANT_PRIVATE_KEY!, 'PRIVATE'), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(b64, 'base64')).toString('utf8'),
  ) as Record<string, string>

/** yyyyMMddHHmmss in Asia/Dhaka. */
function dhakaDateTime(now = new Date()): string {
  return new Date(now.getTime() + 6 * 3600_000).toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

const headers = (ip?: string) => ({
  'Content-Type': 'application/json',
  'X-KM-Api-Version': 'v-0.2.0',
  'X-KM-IP-V4': ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip) ? ip : '127.0.0.1',
  'X-KM-Client-Type': 'PC_WEB',
})

export const nagad: PaymentGateway = {
  id: 'nagad',
  label: { bn: 'নগদ', en: 'Nagad' },
  isConfigured: () => Boolean(env.NAGAD_MERCHANT_ID && env.NAGAD_MERCHANT_NUMBER && env.NAGAD_MERCHANT_PRIVATE_KEY && env.NAGAD_PG_PUBLIC_KEY),

  async initiate(p: InitiateParams): Promise<InitiateResult> {
    const merchantId = env.NAGAD_MERCHANT_ID!
    const orderId = p.reference
    const datetime = dhakaDateTime()
    const challenge = crypto.randomBytes(20).toString('hex')
    const initData = { merchantId, datetime, orderId, challenge }

    const init = await requestJson<{ sensitiveData?: string; signature?: string; reason?: string; message?: string }>(
      `${base()}/check-out/initialize/${merchantId}/${orderId}`,
      {
        method: 'POST',
        headers: headers(p.clientIp),
        body: JSON.stringify({ accountNumber: env.NAGAD_MERCHANT_NUMBER, dateTime: datetime, sensitiveData: encrypt(initData), signature: sign(initData) }),
      },
    )
    if (!init.sensitiveData) throw new GatewayError(`Nagad initialize failed: ${init.message ?? init.reason ?? 'unknown'}`)
    const session = decrypt(init.sensitiveData)
    if (!session.paymentReferenceId || !session.challenge) throw new GatewayError('Nagad initialize returned no payment reference')

    const orderData = {
      merchantId,
      orderId,
      currencyCode: '050',
      amount: poishaToGatewayAmount(p.amount),
      challenge: session.challenge,
    }
    const complete = await requestJson<{ status?: string; callBackUrl?: string; message?: string }>(
      `${base()}/check-out/complete/${session.paymentReferenceId}`,
      {
        method: 'POST',
        headers: headers(p.clientIp),
        body: JSON.stringify({
          sensitiveData: encrypt(orderData),
          signature: sign(orderData),
          merchantCallbackURL: p.callbackUrl,
          additionalMerchantInfo: { orderNumber: p.orderNumber },
        }),
      },
    )
    if (complete.status !== 'Success' || !complete.callBackUrl) {
      throw new GatewayError(`Nagad complete failed: ${complete.message ?? complete.status ?? 'unknown'}`)
    }
    return { redirectUrl: complete.callBackUrl, gatewayPaymentId: session.paymentReferenceId }
  },
}

export async function verifyNagad(paymentRefId: string): Promise<VerifyResult> {
  const res = await requestJson<Record<string, string>>(`${base()}/verify/payment/${encodeURIComponent(paymentRefId)}`, {
    method: 'GET',
    headers: headers(),
  })
  const raw = {
    status: res.status,
    statusCode: res.statusCode,
    orderId: res.orderId,
    amount: res.amount,
    issuerPaymentRefNo: res.issuerPaymentRefNo,
    paymentRefId: res.paymentRefId,
    issuerPaymentDateTime: res.issuerPaymentDateTime,
  }
  if (res.status === 'Success') {
    return { status: 'succeeded', reference: res.orderId, amount: gatewayAmountToPoisha(res.amount), transactionId: res.issuerPaymentRefNo, raw }
  }
  if (res.status === 'Cancelled') return { status: 'cancelled', raw, reason: 'Cancelled by customer' }
  return { status: 'failed', raw, reason: res.message ?? res.status ?? 'Payment not completed' }
}

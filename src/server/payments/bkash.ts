import { env } from '../env'
import { gatewayAmountToPoisha, poishaToGatewayAmount, requestJson } from './http'
import { GatewayError, type InitiateParams, type InitiateResult, type PaymentGateway, type VerifyResult } from './types'

/**
 * bKash Tokenized Checkout (v1.2.0-beta).
 *   POST /tokenized/checkout/token/grant      headers: username, password  body: app_key, app_secret
 *   POST /tokenized/checkout/create           headers: Authorization (id_token), X-APP-Key
 *   POST /tokenized/checkout/execute          → transactionStatus "Completed", trxID
 *   POST /tokenized/checkout/payment/status   → fallback when execute times out
 * The customer returns to callbackURL with ?paymentID=…&status=success|failure|cancel. Only a successful
 * execute/status response with matching amount and invoice number marks the order paid.
 */
const base = () =>
  env.BKASH_BASE_URL || (env.PAYMENTS_SANDBOX ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta')

let cachedToken: { token: string; expiresAt: number } | null = null

async function grantToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token
  const res = await requestJson<{ id_token?: string; expires_in?: number; statusCode?: string; statusMessage?: string }>(
    `${base()}/tokenized/checkout/token/grant`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', username: env.BKASH_USERNAME!, password: env.BKASH_PASSWORD! },
      body: JSON.stringify({ app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET }),
    },
  )
  if (!res.id_token) throw new GatewayError(`bKash token grant failed: ${res.statusMessage ?? 'unknown'}`)
  cachedToken = { token: res.id_token, expiresAt: Date.now() + (res.expires_in ?? 3600) * 1000 }
  return res.id_token
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const token = await grantToken()
  return requestJson<T>(`${base()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: token, 'X-APP-Key': env.BKASH_APP_KEY! },
    body: JSON.stringify(body),
    timeoutMs: 30_000,
  })
}

type BkashPayment = {
  paymentID?: string
  bkashURL?: string
  statusCode?: string
  statusMessage?: string
  transactionStatus?: string
  trxID?: string
  amount?: string
  currency?: string
  merchantInvoiceNumber?: string
}

export const bkash: PaymentGateway = {
  id: 'bkash',
  label: { bn: 'বিকাশ', en: 'bKash' },
  isConfigured: () => Boolean(env.BKASH_APP_KEY && env.BKASH_APP_SECRET && env.BKASH_USERNAME && env.BKASH_PASSWORD),

  async initiate(p: InitiateParams): Promise<InitiateResult> {
    const res = await call<BkashPayment>('/tokenized/checkout/create', {
      mode: '0011', // checkout without agreement
      payerReference: p.customer.phone,
      callbackURL: p.callbackUrl,
      amount: poishaToGatewayAmount(p.amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: p.reference,
    })
    if (res.statusCode !== '0000' || !res.bkashURL || !res.paymentID) {
      throw new GatewayError(`bKash create failed: ${res.statusMessage ?? res.statusCode ?? 'unknown'}`)
    }
    return { redirectUrl: res.bkashURL, gatewayPaymentId: res.paymentID }
  },
}

function toResult(res: BkashPayment): VerifyResult {
  const raw = {
    paymentID: res.paymentID,
    trxID: res.trxID,
    transactionStatus: res.transactionStatus,
    amount: res.amount,
    currency: res.currency,
    merchantInvoiceNumber: res.merchantInvoiceNumber,
    statusCode: res.statusCode,
    statusMessage: res.statusMessage,
  }
  if (res.transactionStatus === 'Completed' && res.trxID) {
    if (res.currency && res.currency !== 'BDT') return { status: 'failed', reason: 'Unexpected currency', raw }
    return { status: 'succeeded', reference: res.merchantInvoiceNumber, amount: gatewayAmountToPoisha(res.amount), transactionId: res.trxID, raw }
  }
  if (res.transactionStatus === 'Initiated' || res.transactionStatus === 'Pending Authorized') return { status: 'pending', raw }
  return { status: 'failed', reason: res.statusMessage ?? res.transactionStatus ?? 'Payment not completed', raw }
}

/** Execute after the customer approved in bKash; falls back to status query if execute fails. */
export async function executeBkash(paymentID: string): Promise<VerifyResult> {
  try {
    return toResult(await call<BkashPayment>('/tokenized/checkout/execute', { paymentID }))
  } catch {
    return queryBkash(paymentID)
  }
}

export async function queryBkash(paymentID: string): Promise<VerifyResult> {
  return toResult(await call<BkashPayment>('/tokenized/checkout/payment/status', { paymentID }))
}

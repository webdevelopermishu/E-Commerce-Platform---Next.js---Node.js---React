import { env } from '../env'
import { gatewayAmountToPoisha, poishaToGatewayAmount, requestJson } from './http'
import { GatewayError, type InitiateParams, type InitiateResult, type PaymentGateway, type VerifyResult } from './types'

/**
 * SSLCommerz API v4 (hosted payment page).
 * Session:    POST {base}/gwprocess/v4/api.php
 * Validation: GET  {base}/validator/api/validationserverAPI.php?val_id&store_id&store_passwd&format=json
 * Success is decided ONLY by the validation API (status VALID/VALIDATED, matching tran_id, amount, currency).
 */
const base = () => (env.PAYMENTS_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com')

export const sslcommerz: PaymentGateway = {
  id: 'sslcommerz',
  label: { bn: 'কার্ড / মোবাইল ব্যাংকিং (SSLCommerz)', en: 'Card / mobile banking (SSLCommerz)' },
  isConfigured: () => Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD),

  async initiate(p: InitiateParams): Promise<InitiateResult> {
    const cb = (result: string) => `${p.callbackUrl}?result=${result}&ref=${encodeURIComponent(p.reference)}`
    const form = new URLSearchParams({
      store_id: env.SSLCOMMERZ_STORE_ID!,
      store_passwd: env.SSLCOMMERZ_STORE_PASSWORD!,
      total_amount: poishaToGatewayAmount(p.amount),
      currency: 'BDT',
      tran_id: p.reference,
      success_url: cb('success'),
      fail_url: cb('fail'),
      cancel_url: cb('cancel'),
      ipn_url: p.ipnUrl ?? cb('ipn'),
      shipping_method: 'Courier',
      product_name: p.productSummary.slice(0, 250),
      product_category: 'Food',
      product_profile: 'physical-goods',
      num_of_item: '1',
      cus_name: p.customer.name.slice(0, 50),
      cus_email: p.customer.email || 'noreply@example.com',
      cus_add1: p.customer.address.slice(0, 50),
      cus_city: p.customer.district || 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: p.customer.phone,
      ship_name: p.customer.name.slice(0, 50),
      ship_add1: p.customer.address.slice(0, 50),
      ship_city: p.customer.district || 'Dhaka',
      ship_postcode: '1000',
      ship_country: 'Bangladesh',
      value_a: p.orderNumber,
    })
    const res = await requestJson<{ status?: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string }>(
      `${base()}/gwprocess/v4/api.php`,
      { method: 'POST', body: form, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    if (res.status !== 'SUCCESS' || !res.GatewayPageURL) {
      throw new GatewayError(`SSLCommerz session failed: ${res.failedreason ?? 'unknown reason'}`)
    }
    return { redirectUrl: res.GatewayPageURL, gatewayPaymentId: res.sessionkey }
  },
}

/** Server-side validation of a val_id posted back by SSLCommerz. */
export async function verifySslcommerz(valId: string): Promise<VerifyResult> {
  const url = new URL(`${base()}/validator/api/validationserverAPI.php`)
  url.searchParams.set('val_id', valId)
  url.searchParams.set('store_id', env.SSLCOMMERZ_STORE_ID!)
  url.searchParams.set('store_passwd', env.SSLCOMMERZ_STORE_PASSWORD!)
  url.searchParams.set('format', 'json')
  const res = await requestJson<Record<string, string>>(url.toString(), { method: 'GET' })
  const ok = res.status === 'VALID' || res.status === 'VALIDATED'
  const raw = {
    status: res.status,
    tran_id: res.tran_id,
    val_id: res.val_id,
    amount: res.amount,
    currency: res.currency,
    currency_type: res.currency_type,
    bank_tran_id: res.bank_tran_id,
    card_type: res.card_type,
    tran_date: res.tran_date,
    risk_level: res.risk_level,
    risk_title: res.risk_title,
  }
  if (!ok) return { status: 'failed', reason: `Validation status ${res.status ?? 'unknown'}`, raw }
  if ((res.currency_type || res.currency) !== 'BDT') return { status: 'failed', reason: 'Unexpected currency', raw }
  return {
    status: 'succeeded',
    reference: res.tran_id,
    amount: gatewayAmountToPoisha(res.currency_amount || res.amount),
    transactionId: res.bank_tran_id || res.val_id,
    raw,
    riskNote: res.risk_level === '1' ? `SSLCommerz marked this payment high risk (${res.risk_title ?? ''}). Verify the customer before dispatch.` : undefined,
  }
}

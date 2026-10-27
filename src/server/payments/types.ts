export type GatewayId = 'sslcommerz' | 'bkash' | 'nagad'
export type PaymentMethodId = 'cod' | GatewayId

export interface InitiateParams {
  /** Our unique reference for this attempt (≤ 20 alphanumeric chars, accepted by every gateway). */
  reference: string
  orderNumber: string
  /** Integer poisha. */
  amount: number
  customer: { name: string; phone: string; email?: string | null; address: string; district?: string | null }
  productSummary: string
  /** Absolute URL of our callback endpoint for this gateway; gateways append their own params. */
  callbackUrl: string
  /** Optional server-to-server notification endpoint. */
  ipnUrl?: string
  clientIp?: string
}

export interface InitiateResult {
  redirectUrl: string
  /** Gateway-side identifier needed for verification (paymentID / sessionkey / paymentReferenceId). */
  gatewayPaymentId?: string
}

/** Outcome of server-side verification. Only `succeeded` with matching amount marks an order paid. */
export interface VerifyResult {
  status: 'succeeded' | 'failed' | 'cancelled' | 'pending'
  reference?: string
  /** Integer poisha reported by the gateway. */
  amount?: number
  transactionId?: string
  reason?: string
  /** Sanitized gateway response for the audit trail (never contains credentials). */
  raw?: unknown
  riskNote?: string
}

export interface PaymentGateway {
  id: GatewayId
  label: { bn: string; en: string }
  isConfigured(): boolean
  initiate(params: InitiateParams): Promise<InitiateResult>
}

export class GatewayError extends Error {
  constructor(message: string, readonly details?: unknown) {
    super(message)
  }
}

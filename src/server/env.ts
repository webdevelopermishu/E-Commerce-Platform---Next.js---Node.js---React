/**
 * Central, validated access to environment variables. Required values fail fast at startup in production.
 * See .env.example for documentation of every variable.
 */
const isProd = process.env.NODE_ENV === 'production'
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'

function required(name: string, devFallback?: string): string {
  const v = process.env[name]
  if (v && v.trim()) return v.trim()
  if (!isProd || isBuild) return devFallback ?? ''
  throw new Error(`Missing required environment variable ${name}. See .env.example.`)
}

const optional = (name: string): string | undefined => {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}
const num = (name: string, fallback: number): number => {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? v : fallback
}
const bool = (name: string, fallback = false): boolean => {
  const v = process.env[name]
  if (v == null || v === '') return fallback
  return ['1', 'true', 'yes'].includes(v.toLowerCase())
}

const secret = required('PAYLOAD_SECRET', 'dev-only-insecure-secret-change-me')
if (isProd && !isBuild && secret.length < 32) {
  throw new Error('PAYLOAD_SECRET must be at least 32 characters in production.')
}

export const env = {
  isProd,
  DATABASE_URL: required('DATABASE_URL', 'postgres://mango:mango_dev_pw@127.0.0.1:5432/mango_shop'),
  DATABASE_POOL_MAX: num('DATABASE_POOL_MAX', 10),
  /** Auto-push schema without migrations. Dev convenience only; never enable in production. */
  DATABASE_PUSH: !isProd && bool('DATABASE_PUSH', false),
  PAYLOAD_SECRET: secret,
  NEXT_PUBLIC_SERVER_URL: (optional('NEXT_PUBLIC_SERVER_URL') || 'http://localhost:3000').replace(/\/$/, ''),
  MAX_UPLOAD_BYTES: num('MAX_UPLOAD_BYTES', 8 * 1024 * 1024),

  // Media storage (S3-compatible) — optional; local MEDIA_DIR is used when S3_BUCKET is empty.
  S3_BUCKET: optional('S3_BUCKET'),
  S3_REGION: optional('S3_REGION'),
  S3_ENDPOINT: optional('S3_ENDPOINT'),
  S3_PREFIX: optional('S3_PREFIX'),
  S3_ACCESS_KEY_ID: optional('S3_ACCESS_KEY_ID'),
  S3_SECRET_ACCESS_KEY: optional('S3_SECRET_ACCESS_KEY'),
  S3_FORCE_PATH_STYLE: bool('S3_FORCE_PATH_STYLE', false),

  // Email (optional)
  SMTP_HOST: optional('SMTP_HOST'),
  SMTP_PORT: num('SMTP_PORT', 587),
  SMTP_USER: optional('SMTP_USER'),
  SMTP_PASS: optional('SMTP_PASS'),
  EMAIL_FROM_ADDRESS: optional('EMAIL_FROM_ADDRESS'),
  EMAIL_FROM_NAME: optional('EMAIL_FROM_NAME'),
  ORDER_NOTIFICATION_EMAIL: optional('ORDER_NOTIFICATION_EMAIL'),

  // Payments (optional; each gateway is available only when all its credentials are set)
  PAYMENTS_SANDBOX: bool('PAYMENTS_SANDBOX', true),
  SSLCOMMERZ_STORE_ID: optional('SSLCOMMERZ_STORE_ID'),
  SSLCOMMERZ_STORE_PASSWORD: optional('SSLCOMMERZ_STORE_PASSWORD'),
  BKASH_APP_KEY: optional('BKASH_APP_KEY'),
  BKASH_APP_SECRET: optional('BKASH_APP_SECRET'),
  BKASH_USERNAME: optional('BKASH_USERNAME'),
  BKASH_PASSWORD: optional('BKASH_PASSWORD'),
  BKASH_BASE_URL: optional('BKASH_BASE_URL'),
  NAGAD_MERCHANT_ID: optional('NAGAD_MERCHANT_ID'),
  NAGAD_MERCHANT_NUMBER: optional('NAGAD_MERCHANT_NUMBER'),
  NAGAD_MERCHANT_PRIVATE_KEY: optional('NAGAD_MERCHANT_PRIVATE_KEY'),
  NAGAD_PG_PUBLIC_KEY: optional('NAGAD_PG_PUBLIC_KEY'),
  NAGAD_BASE_URL: optional('NAGAD_BASE_URL'),
}

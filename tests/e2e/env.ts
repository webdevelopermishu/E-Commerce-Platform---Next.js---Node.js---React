import 'dotenv/config'

export const E2E_ADMIN = { email: 'e2e-admin@example.test', password: 'e2e-only-password-123' }

/** Environment for the server under test: isolated DB, test port, no external integrations. */
export function e2eEnv(): Record<string, string> {
  const base = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL || 'postgres://mango:mango_dev_pw@127.0.0.1:5432/mango_shop'
  const url = new URL(base)
  if (!process.env.E2E_DATABASE_URL) url.pathname = `${url.pathname.replace(/_e2e$/, '')}_e2e`
  if (!url.pathname.endsWith('_e2e')) throw new Error('E2E tests must use a database whose name ends in _e2e')
  const env: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined || /^(SMTP_|SSLCOMMERZ_|BKASH_|NAGAD_|S3_|GA4|GTM)/.test(k)) continue
    env[k] = v
  }
  return {
    ...env,
    DATABASE_URL: url.toString(),
    PORT: '3100',
    // Must equal the origin the browser uses: Payload only accepts cookie sessions (CSRF check) from this URL.
    NEXT_PUBLIC_SERVER_URL: 'http://127.0.0.1:3100',
    HOSTNAME: '127.0.0.1',
    // Not under test-results/: Playwright empties that folder at the start of every run.
    MEDIA_DIR: process.env.E2E_MEDIA_DIR || '.e2e/media',
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'e2e-secret-e2e-secret-e2e-secret-e2e',
    // The production build sets secure cookies; the test server is plain HTTP on localhost.
    INSECURE_COOKIES: 'true',
    PAYMENTS_SANDBOX: 'true',
  }
}

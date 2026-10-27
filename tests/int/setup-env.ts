/**
 * Integration tests run against an ISOLATED database (never the dev or production one).
 * TEST_DATABASE_URL wins; otherwise the dev DATABASE_URL's database name gets a `_test` suffix.
 * The schema is dropped and re-migrated at the start of every test file.
 */
import 'dotenv/config'
import os from 'node:os'
import path from 'node:path'

const base = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgres://mango:mango_dev_pw@127.0.0.1:5432/mango_shop'
const url = new URL(base)
if (!process.env.TEST_DATABASE_URL) url.pathname = `${url.pathname.replace(/_test$/, '')}_test`
if (!url.pathname.endsWith('_test')) throw new Error(`Refusing to run integration tests against non-test database ${url.pathname}`)

process.env.DATABASE_URL = url.toString()
process.env.DATABASE_PUSH = 'false'
process.env.MEDIA_DIR = path.join(os.tmpdir(), 'mango-shop-test-media')
process.env.PAYLOAD_SECRET ||= 'integration-test-secret-integration-test-secret'
// Never talk to real payment providers or mail servers from tests.
for (const k of Object.keys(process.env)) if (/^(SMTP_|SSLCOMMERZ_|BKASH_|NAGAD_|S3_)/.test(k)) delete process.env[k]

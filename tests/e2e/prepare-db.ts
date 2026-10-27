import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import pg from 'pg'
import { E2E_ADMIN, e2eEnv } from './env'

/**
 * Drop and recreate the e2e database, run migrations, seed sample data and create a test admin.
 * Runs BEFORE Playwright (`npm run test:e2e`), because Playwright starts the web server before any global setup.
 */
async function prepare() {
  if (process.env.E2E_BASE_URL) return // testing an external server: its data is managed elsewhere
  const env = e2eEnv()
  const url = new URL(env.DATABASE_URL!)
  const name = url.pathname.slice(1).replace(/"/g, '')
  const admin = new URL(url)
  admin.pathname = '/postgres'
  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  try {
    await client.query(`drop database if exists "${name}" with (force)`)
    await client.query(`create database "${name}"`)
  } finally {
    await client.end()
  }
  rmSync(env.MEDIA_DIR!, { recursive: true, force: true })
  const run = (args: string[], extra: Record<string, string> = {}) =>
    execFileSync('npm', args, { env: { ...env, NODE_ENV: 'development', ...extra }, stdio: 'inherit' })
  run(['run', 'migrate'])
  run(['run', 'seed'])
  run(['run', 'create-admin', '--', '--email', E2E_ADMIN.email, '--name', 'E2E Admin'], { ADMIN_PASSWORD: E2E_ADMIN.password })
}

prepare().catch((err) => {
  console.error(err)
  process.exit(1)
})

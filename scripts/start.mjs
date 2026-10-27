// Production launcher for the standalone build.
// - loads .env from the project root if present (real environment variables take precedence)
// - resolves MEDIA_DIR to an absolute path BEFORE Next changes directory into .next/standalone
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(import.meta.dirname, '..')
const envFile = path.join(root, '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile) // does not override variables already set

process.env.MEDIA_DIR = path.resolve(root, process.env.MEDIA_DIR || 'media')
process.env.NODE_ENV = 'production'
process.env.PORT ||= '3000'
process.env.HOSTNAME ||= '127.0.0.1' // bind to loopback; put Nginx/Caddy in front. Set HOSTNAME=0.0.0.0 in Docker.

const server = path.join(root, '.next', 'standalone', 'server.js')
if (!existsSync(server)) {
  console.error('Build output missing. Run `npm run build` first.')
  process.exit(1)
}
await import(server)

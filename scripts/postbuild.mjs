// Next's standalone output does not include static assets; copy them next to server.js so `npm start` is self-contained.
import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, '.next', 'standalone')
if (!existsSync(out)) {
  console.error('postbuild: .next/standalone not found (is output: "standalone" set?)')
  process.exit(1)
}
cpSync(path.join(root, 'public'), path.join(out, 'public'), { recursive: true })
cpSync(path.join(root, '.next', 'static'), path.join(out, '.next', 'static'), { recursive: true })
// Defensive: never ship uploaded media or local env files inside the build output.
for (const p of ['media', '.env', '.env.local']) rmSync(path.join(out, p), { recursive: true, force: true })
console.log('postbuild: copied public/ and .next/static into .next/standalone')

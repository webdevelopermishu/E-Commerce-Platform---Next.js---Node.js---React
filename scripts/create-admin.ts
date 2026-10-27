/**
 * Create (or promote) a staff account from the server's command line.
 *
 *   npm run create-admin -- --email owner@example.com --name "Owner"
 *   npm run create-admin -- --email owner@example.com --role manager
 *
 * The password is read interactively (not echoed, never stored in shell history) or from the
 * ADMIN_PASSWORD environment variable for non-interactive provisioning. Minimum 12 characters.
 * There is no default account and no default password.
 */
import 'dotenv/config'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type Role = 'admin' | 'manager' | 'editor'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : undefined
}

async function askHidden(question: string): Promise<string> {
  let muted = false
  const out = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk)
      cb()
    },
  })
  const rl = createInterface({ input: process.stdin, output: out, terminal: true })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
    muted = true
  })
}

async function main() {
  const email = (arg('email') ?? '').trim().toLowerCase()
  const name = arg('name') ?? ''
  const role = (arg('role') ?? 'admin') as Role
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run create-admin -- --email you@example.com [--name "Your Name"] [--role admin|manager|editor]')
    process.exit(1)
  }
  if (!['admin', 'manager', 'editor'].includes(role)) {
    console.error('--role must be admin, manager or editor')
    process.exit(1)
  }

  let password = process.env.ADMIN_PASSWORD ?? ''
  if (!password) {
    if (!process.stdin.isTTY) {
      console.error('No terminal available: set ADMIN_PASSWORD in the environment for non-interactive use.')
      process.exit(1)
    }
    password = await askHidden('Password (min 12 characters): ')
    const again = await askHidden('Repeat password: ')
    if (password !== again) {
      console.error('Passwords do not match.')
      process.exit(1)
    }
  }
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.')
    process.exit(1)
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
  const context = { allowStaffBootstrap: true }
  if (existing.docs[0]) {
    const u = existing.docs[0]
    const roles = Array.from(new Set([...(u.roles ?? []), role])) as Role[]
    await payload.update({ collection: 'users', id: u.id, data: { password, roles, ...(name ? { name } : {}) }, overrideAccess: true, context })
    console.log(`Updated ${email}: roles = ${roles.join(', ')}; password reset.`)
  } else {
    await payload.create({ collection: 'users', data: { email, password, name, roles: [role] }, overrideAccess: true, context })
    console.log(`Created ${role} account for ${email}. Sign in at /admin.`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})




//If above doesn't work [Issues appears with creating admin --take off the above entirely; and try below]
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

try {
  const user = await payload.create({
    collection: 'users',
    overrideAccess: true,
    context: { allowStaffBootstrap: true },
    data: {
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      roles: ['admin'],
    } as any,
  })
  console.log('Created admin:', user.id, user.email)
} catch (err) {
  console.error('Failed:', err)
}
process.exit(0)
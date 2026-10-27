import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig, type Plugin } from 'payload'
import sharp from 'sharp'
import { migrations } from './migrations'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { FAQs, Pages, Posts, Redirects, Testimonials } from './collections/content'
import { Coupons } from './collections/Coupons'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Payments } from './collections/Payments'
import { Products } from './collections/Products'
import { StockAdjustments } from './collections/StockAdjustments'
import { Users } from './collections/Users'
import { Homepage } from './globals/Homepage'
import { AnalyticsSettings, Branding, ContactSettings, DeliverySettings, Navigation, PaymentSettings } from './globals/settings'
import { env } from './server/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const plugins: Plugin[] = []

// Production media storage: any S3-compatible service (AWS S3, Cloudflare R2, DigitalOcean Spaces, MinIO, Backblaze B2…).
if (env.S3_BUCKET) {
  plugins.push(
    s3Storage({
      collections: { media: { prefix: env.S3_PREFIX || 'media' } },
      bucket: env.S3_BUCKET,
      config: {
        region: env.S3_REGION || 'auto',
        endpoint: env.S3_ENDPOINT || undefined,
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
        credentials: { accessKeyId: env.S3_ACCESS_KEY_ID || '', secretAccessKey: env.S3_SECRET_ACCESS_KEY || '' },
      },
    }),
  )
}

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  secret: env.PAYLOAD_SECRET,
  admin: {
    user: Users.slug,
    // Built-in avatar: Gravatar would send a hash of each staff email to a third party on every admin page view.
    avatar: 'default',
    meta: { titleSuffix: ' — Admin', robots: 'noindex, nofollow' },
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      beforeDashboard: ['/components/admin/Dashboard#Dashboard'],
      graphics: { Logo: '/components/admin/AdminLogo#AdminLogo', Icon: '/components/admin/AdminLogo#AdminIcon' },
    },
    dateFormat: 'd MMM yyyy, h:mm a',
  },
  collections: [
    Products,
    Categories,
    StockAdjustments,
    Orders,
    Payments,
    Customers,
    Coupons,
    Media,
    FAQs,
    Testimonials,
    Posts,
    Pages,
    Redirects,
    Users,
  ],
  globals: [Homepage, Branding, ContactSettings, Navigation, DeliverySettings, PaymentSettings, AnalyticsSettings],
  localization: {
    locales: [
      { code: 'bn', label: 'বাংলা' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'bn',
    fallback: true,
  },
  i18n: { fallbackLanguage: 'en' },
  editor: lexicalEditor(),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL, max: env.DATABASE_POOL_MAX },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema changes in production go through migrations only (npm run migrate).
    push: env.DATABASE_PUSH,
    // Docker / single-instance deployments can apply pending migrations automatically at startup.
    ...(process.env.RUN_MIGRATIONS_ON_START === 'true' ? { prodMigrations: migrations } : {}),
  }),
  email: env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: env.EMAIL_FROM_ADDRESS || 'no-reply@example.com',
        defaultFromName: env.EMAIL_FROM_NAME || 'Shop',
        transportOptions: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        },
      })
    : undefined,
  upload: {
    limits: { fileSize: env.MAX_UPLOAD_BYTES },
  },
  cors: [env.NEXT_PUBLIC_SERVER_URL],
  csrf: [env.NEXT_PUBLIC_SERVER_URL],
  graphQL: { disable: true },
  sharp,
  plugins,
  telemetry: false,
})

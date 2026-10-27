# Amrokunjo — bilingual mango & traditional-food store

A production-ready e-commerce site for a Bangladeshi food brand: Bangla-first storefront with full English,
real cart/checkout/orders backed by PostgreSQL, and a Payload CMS admin panel at `/admin` for products,
inventory, orders, content, translations, branding and SEO.

> "Amrokunjo / আম্রকুঞ্জ" is a **placeholder** brand. Change name, tagline, logo, colours, favicon and website
> title in **Admin → Website Settings → Branding** — no code changes needed.

| | |
|---|---|
| Framework | Next.js **16.4.3** (App Router, standalone output) · React 19.2 · TypeScript 5 (strict) |
| CMS / admin | Payload CMS **3.92.0** (inside the same Next.js app) |
| Database | PostgreSQL 15+ (tested on 16) via `@payloadcms/db-postgres` with migrations |
| Styling | Tailwind CSS 4, design tokens in `src/app/(frontend)/globals.css` |
| Fonts (self-hosted) | Noto Serif Bengali + Hind Siliguri (Bangla), DM Serif Display + DM Sans (Latin) |
| Validation / forms | Zod 4, React Hook Form |
| Media | Local disk (`MEDIA_DIR`) or any S3-compatible bucket; Sharp generates WebP/AVIF sizes |
| Tests | Vitest (unit + integration on a real test DB), Playwright (end-to-end) |
| Runtime | Node.js **≥ 22.12** |

Deployment guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** · Admin handbook: **[docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md)**

---

## Features

**Storefront** (`/bn/...` default, `/en/...`)
- Homepage: announcement bar, mango hero with seasonal badge, trust benefits, category mosaic, featured mangoes,
  rows per traditional-food category, promo banner, brand story, popular products & bundles, testimonials
  (only published, moderated reviews), FAQ, editable footer — every section editable and switchable in admin.
- Shop with search (Bangla + English), category, price and in-stock filters, sorting, pagination, empty states.
- Product pages: gallery, pack-size variants with their own price/SKU/stock, sale pricing with schedules,
  quantity, add to cart / buy now, attributes, delivery note, related products, breadcrumbs.
- Signature add-to-cart button: loading → "Added" → error / out-of-stock states, mini-cart drawer,
  screen-reader announcements, reduced-motion support.
- Cart priced by the server (browser prices are never trusted), coupons, delivery fee by district zone.
- Checkout: Bangladesh phone validation (Bangla digits accepted), division/district, delivery method,
  cash on delivery + bKash / Nagad / SSLCommerz adapters (enabled once credentials are configured).
- Orders: unique order numbers, private confirmation link (signed token), tracking by order number + phone.
- Floating WhatsApp button: number, messages, tooltip, position and pages configured in admin; message follows
  the language and includes the product name/URL on product pages. Never includes customer data.
- Language switcher keeps the current page, search and filters; preference remembered.

**Admin** (`/admin`)
- Live dashboard: orders, booked vs collected revenue, pending/completed, low stock, recent orders, sales chart.
- Products (variants, stock ledger, images, categories, tags, SEO, translations status, CSV import/export,
  duplicate), categories (nested, ordered, publishable), media library, coupons.
- Orders: status history, payment status separate from fulfilment, printable invoice, CSV export,
  cancellation restores stock.
- Content: homepage, navigation & footer, FAQs, testimonials, policy pages, blog.
- Website Settings: Branding, Contact & WhatsApp, Delivery zones/methods, Payments, Analytics (GA4/GTM/Search Console with consent banner).
- Roles: **admin** (everything), **manager** (catalog, content, orders), **editor** (catalog + content).

**SEO**: server-rendered pages, per-language canonical + `hreflang` (bn, en, x-default), sitemap with both
languages, robots.txt, JSON-LD (Organization, WebSite, BreadcrumbList, Product/Offer, Article), editable SEO
fields with noindex, automatic redirects when slugs change, `X-Robots-Tag: noindex` on admin/API/order pages.

---

## Quick start (local development)

Requirements: Node.js 22.12+, npm 10+, PostgreSQL 15+.

```bash
# 1. Database (example for a local PostgreSQL)
sudo -u postgres psql -c "CREATE ROLE mango LOGIN PASSWORD 'mango_dev_pw';"
sudo -u postgres psql -c "CREATE DATABASE mango_shop OWNER mango;"
# (tests also create mango_shop_test / mango_shop_e2e — give the role CREATEDB, see Testing)

# 2. Configure
cp .env.example .env
#    set DATABASE_URL, PAYLOAD_SECRET (openssl rand -base64 48),
#    NEXT_PUBLIC_SERVER_URL=http://localhost:3000, MEDIA_DIR=./media

# 3. Install, migrate, seed sample data, create your admin account
npm ci
npm run migrate
npm run seed                       # ~22 SAMPLE products, categories, pages, FAQs (see "Sample data")
npm run create-admin -- --email you@example.com --name "Your Name"   # prompts for a password

# 4. Run
npm run dev                        # http://localhost:3000  (admin: /admin)
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (`.next/standalone` + static assets copied in) |
| `npm start` | Start the production build (`scripts/start.mjs`, reads `.env`) |
| `npm run migrate` | Apply pending database migrations |
| `npm run migrate:status` | List applied/pending migrations |
| `npm run migrate:create -- name` | Create a migration after changing collections/fields |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after schema changes |
| `npm run generate:importmap` | Regenerate the admin import map after adding admin components |
| `npm run seed` | Insert sample data when the catalogue is empty (`-- --reset` replaces catalogue/content; never orders/users) |
| `npm run create-admin -- --email … [--role admin\|manager\|editor]` | Create a staff account or reset its password |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit + integration tests |
| `npm run test:e2e` | End-to-end tests (needs `npm run build` first) |
| `scripts/backup.sh` | Database + media backup (see deployment guide) |

## Environment variables

All variables are documented inline in **[.env.example](.env.example)**. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `PAYLOAD_SECRET` | **yes** (≥ 32 chars) | Signs sessions and private order links |
| `NEXT_PUBLIC_SERVER_URL` | **yes** | Public origin, e.g. `https://www.example.com`. Must match the real domain — admin logins are only accepted from this origin (CSRF protection) |
| `MEDIA_DIR` | recommended | Persistent upload directory outside the app folder (default `./media`) |
| `S3_*`, `MEDIA_PUBLIC_HOSTNAMES` | optional | S3-compatible media storage |
| `SMTP_*`, `EMAIL_FROM_*`, `ORDER_NOTIFICATION_EMAIL` | optional | Order emails |
| `PAYMENTS_SANDBOX`, `SSLCOMMERZ_*`, `BKASH_*`, `NAGAD_*` | optional | Online payments (cash on delivery works without them) |
| `PORT`, `HOSTNAME` | optional | Server bind (default `127.0.0.1:3000`) |
| `ORDER_PREFIX`, `MAX_UPLOAD_BYTES`, `DATABASE_POOL_MAX`, `ROBOTS_DISALLOW_ALL` | optional | Tuning |
| `RUN_MIGRATIONS_ON_START` | optional | Apply migrations when the server boots (used by Docker) |

Google Analytics / Tag Manager / Search Console IDs and the WhatsApp number are set in the **admin**, not env.

## Testing

```bash
# The database role needs CREATEDB so tests can create their own databases:
sudo -u postgres psql -c "ALTER ROLE mango CREATEDB;"

npm test                 # 46 unit tests + 19 integration tests
npm run build && npm run test:e2e    # 26 Playwright tests (desktop + mobile)
```

- **Integration tests** use `<db>_test` (or `TEST_DATABASE_URL`). Each file drops and re-migrates the schema,
  then checks real order creation: database pricing, item snapshots, stock decrement, **no overselling under
  6 concurrent checkouts**, idempotent double submits, stock restore on cancel, order-lookup security,
  access control per role, and bilingual saves.
- **E2E tests** use `<db>_e2e` (or `E2E_DATABASE_URL`), recreated and seeded on every run, against the production
  build on port 3100. Only cash on delivery is enabled and all gateway/SMTP variables are stripped, so no real
  payment or message is ever sent. If Playwright's own browser is not installed, run `npx playwright install chromium`
  or point `PLAYWRIGHT_CHROMIUM_PATH` at an existing Chromium/headless-shell binary.

## Project structure

```
src/
  app/(frontend)/[lang]/     storefront routes (home, shop, category, product, cart, checkout, order, track-order, blog, pages)
  app/(frontend)/actions.ts  server actions: quote cart, place order, track order, retry payment
  app/(payload)/             Payload admin + REST API (generated wiring)
  app/payments/              payment gateway callbacks / IPN (server-side verification)
  app/healthz/               health check (DB connectivity)
  app/sitemap.ts, robots.ts  SEO files
  proxy.ts                   locale routing (Next 16 "proxy", formerly middleware)
  collections/  globals/     Payload schema: products, categories, orders, payments, customers, media, content, settings
  fields/  hooks/  access/   reusable fields (money, SEO, slug, translation status), slug redirects, role checks
  components/                storefront UI (layout, home, product, cart, checkout, shop, whatsapp…) + admin widgets
  lib/                       pure business logic: money (integer poisha), pricing, cart math, coupons, delivery,
                             validation, i18n dictionaries (bn/en), SEO metadata & JSON-LD, rate limiting
  server/                    server-only services: queries, order creation (transactional), payments adapters,
                             inventory SQL, notifications, CSV import/export, invoices
  migrations/                database migrations
scripts/                     seed, create-admin, start (standalone launcher), postbuild, backup
tests/unit|int|e2e           Vitest and Playwright suites
deploy/                      Nginx, PM2, systemd examples
docs/                        DEPLOYMENT.md, ADMIN-GUIDE.md
Dockerfile, docker-compose.yml
```

## Money, stock and orders — design notes

- All amounts are **integer poisha** (৳1 = 100) end to end; the admin shows and accepts taka.
- The browser cart stores only product/variant IDs and quantities. Every quote and every order is re-priced
  from the database (sale schedules, coupons, delivery zone) — a tampered browser cannot change prices.
- Order creation runs in one database transaction: conditional `UPDATE … SET stock = stock - n WHERE stock >= n`
  per variant, coupon usage, order + item snapshots (name, SKU, variant, unit price), stock-ledger rows.
- Each checkout carries an idempotency key, so a double click or network retry returns the same order.
- Online payments are marked paid only after server-to-server verification with the gateway **and** an exact
  amount match; a browser redirect alone never marks an order paid.

## Sample data

`npm run seed` creates **sample** content so the site is browsable: ~22 products across mangoes, gur, ghee,
achar, pumpkin bori and combos, with Bangla + English names/descriptions, variants, prices, stock and SEO;
6 categories; FAQs; policy pages (marked as samples to rewrite); 2 blog posts; an **inactive** sample coupon.

- Product images are **original illustrations** generated by the seed script (no third-party photos are used).
  Replace them with your own photography in Admin → Media / each product.
- Prices, stock, delivery times and policy wording are placeholders — review every item before launch.
- No testimonials are seeded (only genuine reviews should be published), and **no WhatsApp number** is set.
- Remove all sample data: delete in the admin, or `npm run seed -- --reset` then delete what you don't need.

## Known limitations

- **Customer accounts** are intentionally not implemented: guests check out with name + phone, receive a
  private order link and can track orders by order number + phone. Customer records are still kept for staff.
- Payment adapters follow the providers' documented flows but **must be tested in each provider's sandbox with
  your merchant credentials** before going live (none could be tested here without credentials).
- The in-memory rate limiter is per process; run one instance (as configured) or swap in a shared store.
- `npm audit` reports advisories in Payload's transitive dependencies (esbuild in drizzle-kit's dev tooling;
  happy-dom in Lexical's HTML importer, which this app does not feed untrusted HTML). Update Payload when fixes ship.

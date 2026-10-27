import { expect, test, type Page } from '@playwright/test'
import { E2E_ADMIN } from './env'

test.describe.configure({ mode: 'serial' })

async function login(page: Page) {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(E2E_ADMIN.email)
  await page.locator('#field-password').fill(E2E_ADMIN.password)
  await page.locator('form').getByRole('button', { name: /login/i }).click()
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 30_000 })
}

/** Save the open admin document; Save goes back to disabled once the form is persisted and clean. */
async function save(page: Page) {
  const button = page.locator('#action-save')
  await expect(button).toBeEnabled()
  await button.click()
  await expect(button).toBeDisabled({ timeout: 20_000 })
  await expect(page.locator('.field-error, [class*="field-error"]')).toHaveCount(0)
}

async function productId(page: Page, slug: string): Promise<number> {
  const res = await page.request.get(`/api/products?where[slug][equals]=${slug}&depth=0&limit=1`)
  const json = await res.json()
  return json.docs[0].id
}

test('admin pages are protected and not indexable', async ({ page, request }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
  const orders = await request.get('/api/orders')
  expect([401, 403]).toContain(orders.status())
  const res = await request.get('/admin/login')
  expect(res.headers()['x-robots-tag'] ?? '').toMatch(/noindex/)
  // Uploaded files are served with a sandboxing CSP (an uploaded SVG can never run scripts).
  const media = await (await request.get('/api/media?limit=1&depth=0')).json()
  const file = await request.get(new URL(media.docs[0].url).pathname)
  expect(file.status()).toBe(200)
  expect(file.headers()['content-security-policy']).toContain('sandbox')
})

test('rejects a wrong password', async ({ page }) => {
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(E2E_ADMIN.email)
  await page.locator('#field-password').fill('wrong-password-123')
  await page.locator('form').getByRole('button', { name: /login/i }).click()
  await expect(page.getByText(/incorrect|invalid/i).first()).toBeVisible()
})

test('admin login shows the live dashboard', async ({ page }) => {
  await login(page)
  await expect(page.getByText('Booked revenue').first()).toBeVisible()
  await expect(page.getByText(/Low stock/i).first()).toBeVisible()
})

test('edit a product in the admin and see it on the storefront', async ({ page }) => {
  await login(page)
  const id = await productId(page, 'gopalbhog-mango')
  await page.goto(`/admin/collections/products/${id}`)
  await page.locator('#field-name').fill('গোপালভোগ আম (বিশেষ)')
  await save(page)
  await page.goto('/bn/product/gopalbhog-mango')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('গোপালভোগ আম (বিশেষ)')
})

test('create a product (staff session) and find it in the shop', async ({ page }) => {
  await login(page)
  const cats = await (await page.request.get('/api/categories?where[slug][equals]=other&limit=1')).json()
  // Cookie sessions are only honoured with a same-origin Origin header (Payload's CSRF protection), as a browser sends.
  const origin = new URL(page.url()).origin
  const res = await page.request.post('/api/products?locale=bn', {
    headers: { Origin: origin },
    data: {
      name: 'পরীক্ষামূলক আমসত্ত্ব',
      slug: 'e2e-amsotto',
      status: 'published',
      categories: [cats.docs[0].id],
      variants: [{ label: '২০০ গ্রাম', sku: 'E2E-AMS-200', unit: 'g', packSize: 200, price: 25000, stock: 12 }],
    },
  })
  expect(res.status()).toBe(201)
  await page.goto('/bn/shop?q=' + encodeURIComponent('পরীক্ষামূলক'))
  await expect(page.getByTestId('product-card')).toHaveCount(1)
  await expect(page.getByTestId('product-card')).toContainText(/৳\s?২৫০/)
  // Anonymous visitors cannot create products.
  const anon = await page.context().browser()!.newContext()
  const denied = await anon.request.post(new URL('/api/products', page.url()).toString(), { data: { name: 'x', slug: 'x' } })
  expect([401, 403]).toContain(denied.status())
  await anon.close()
})

test('translation management: English name is saved separately', async ({ page }) => {
  await login(page)
  const id = await productId(page, 'fazli-mango')
  await page.goto(`/admin/collections/products/${id}?locale=en`)
  await expect(page.locator('#field-name')).toHaveValue('Fazli Mango')
  await page.locator('#field-name').fill('Fazli Mango (Large)')
  await save(page)
  await page.goto('/en/product/fazli-mango')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fazli Mango (Large)')
  await page.goto('/bn/product/fazli-mango')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ফজলি আম')
})

test('SEO settings: product SEO title overrides the page title', async ({ page }) => {
  await login(page)
  const id = await productId(page, 'amrapali-mango')
  await page.goto(`/admin/collections/products/${id}?locale=en`)
  await page.getByRole('button', { name: 'SEO', exact: true }).click()
  await page.locator('#field-seo__title').fill('Buy Amrapali Mango Online')
  await save(page)
  await page.goto('/en/product/amrapali-mango')
  await expect(page).toHaveTitle(/Buy Amrapali Mango Online/)
})

test('branding settings: website title updates the storefront', async ({ page }) => {
  await login(page)
  await page.goto('/admin/globals/branding?locale=en')
  await page.locator('#field-siteTitle').fill('Mango House E2E')
  await save(page)
  // The homepage uses the "Default SEO title"; the website title is appended to every other page's title.
  await page.goto('/en/shop')
  await expect(page).toHaveTitle(/Mango House E2E/)
})

test('WhatsApp settings drive the floating button and its message', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByTestId('whatsapp-button')).toHaveCount(0) // hidden until a number is configured
  await login(page)
  await page.goto('/admin/globals/contact-settings')
  await page.locator('#field-whatsappNumber').fill('8801711111111')
  await save(page)

  await page.goto('/en')
  const btn = page.getByTestId('whatsapp-button')
  await expect(btn).toHaveAttribute('href', /^https:\/\/wa\.me\/8801711111111\?text=/)
  expect(decodeURIComponent((await btn.getAttribute('href'))!)).toContain("I'd like to know more")
  await expect(btn).toHaveAttribute('target', '_blank')

  await page.goto('/bn/product/langra-mango')
  const href = decodeURIComponent((await page.getByTestId('whatsapp-button').getAttribute('href'))!)
  expect(href).toContain('ল্যাংড়া আম')
  expect(href).toContain('/bn/product/langra-mango')
})

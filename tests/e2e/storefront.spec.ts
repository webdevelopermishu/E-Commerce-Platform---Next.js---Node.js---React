import { expect, test, type Page } from '@playwright/test'

async function addHimsagar(page: Page, lang = 'en') {
  await page.goto(`/${lang}/product/himsagar-mango`)
  await page.getByTestId('add-to-cart').first().click()
  await expect(page.getByTestId('cart-drawer')).toBeVisible()
  await expect(page.getByTestId('cart-count')).toHaveText(/1|১/)
}

test.describe('storefront', () => {
  test('homepage loads in Bangla by default with real products', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBe(200)
    await expect(page).toHaveURL(/\/bn$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('আম')
    expect(await page.getByTestId('product-card').count()).toBeGreaterThan(4)
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', /\/en$/)
  })

  test('language switch keeps the current product and the search query', async ({ page }) => {
    await page.goto('/bn/product/langra-mango')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ল্যাংড়া আম')
    await page.getByRole('link', { name: 'English' }).first().click()
    await expect(page).toHaveURL(/\/en\/product\/langra-mango/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Langra Mango')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')

    await page.goto('/en/shop?q=ghee')
    await page.getByRole('link', { name: 'বাংলা' }).first().click()
    await expect(page).toHaveURL(/\/bn\/shop\?q=ghee/)
    // The preference is remembered for the next visit to "/".
    await page.goto('/')
    await expect(page).toHaveURL(/\/bn$/)
  })

  test('category navigation shows only that category', async ({ page }) => {
    await page.goto('/en')
    await page.locator('header nav').getByRole('link', { name: 'Mangoes' }).click()
    await expect(page).toHaveURL(/\/en\/category\/mango/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Mango/)
    const names = await page.getByTestId('product-card').locator('h3').allTextContents()
    expect(names.length).toBeGreaterThan(3)
    expect(names.join(' ')).not.toMatch(/Ghee|Gur|Achar/)
  })

  test('search works in English and Bangla, with an empty state', async ({ page }) => {
    await page.goto('/en/shop')
    await page.getByRole('searchbox').first().fill('himsagar')
    await page.getByRole('searchbox').first().press('Enter')
    await expect(page).toHaveURL(/q=himsagar/)
    await expect(page.getByTestId('product-card')).toHaveCount(1)
    await page.goto('/bn/shop?q=' + encodeURIComponent('ঘি'))
    expect(await page.getByTestId('product-card').count()).toBeGreaterThan(0)
    await page.goto('/en/shop?q=zzzznothing')
    await expect(page.getByTestId('product-card')).toHaveCount(0)
    await expect(page.getByText(/Nothing matches/i)).toBeVisible()
  })

  test('product page shows variants, price, stock and structured data', async ({ page }) => {
    await page.goto('/en/product/himsagar-mango')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Himsagar Mango')
    await expect(page.getByTestId('stock-status')).toHaveText(/In stock/i)
    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toContainText('Mangoes')
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
    const product = ld.map((s) => JSON.parse(s)).find((j) => j['@type'] === 'Product')
    expect(product.name).toBe('Himsagar Mango')
    expect(JSON.stringify(product.offers)).toContain('"priceCurrency":"BDT"')
    expect(product.aggregateRating).toBeUndefined()
    // Switching variant changes the price.
    const before = await page.locator('main').getByText(/৳/).first().textContent()
    await page.getByRole('radio', { name: /10 kg/ }).check({ force: true })
    await expect(page.locator('main').getByText(/৳/).first()).not.toHaveText(before!)
  })

  test('add to cart shows the confirmation state and updates the cart count', async ({ page }) => {
    await page.goto('/en/product/himsagar-mango')
    const btn = page.getByTestId('add-to-cart').first()
    await expect(btn).toHaveText(/Add to cart/)
    await btn.click()
    await expect(btn).toHaveText(/Added to cart/)
    await expect(page.getByTestId('cart-drawer')).toBeVisible()
    await expect(page.getByTestId('cart-drawer')).toContainText('Himsagar Mango')
    await expect(page.getByTestId('cart-count')).toHaveText('1')
  })

  test('cart quantity updates recalculate totals on the server and persist', async ({ page }) => {
    await addHimsagar(page)
    await page.goto('/en/cart')
    const line = page.getByTestId('cart-line').first()
    const total1 = await page.getByTestId('cart-subtotal').textContent()
    await line.getByRole('button', { name: 'Increase quantity' }).click()
    await expect(page.getByTestId('cart-subtotal')).not.toHaveText(total1!)
    await expect(page.getByTestId('cart-count')).toHaveText('2')
    await page.reload()
    await expect(page.getByTestId('cart-count')).toHaveText('2')
    await page.getByTestId('cart-line').first().getByRole('button', { name: /Remove/ }).click()
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible()
  })

  test('out-of-stock products cannot be added', async ({ page }) => {
    await page.goto('/en/product/khirsapat-mango')
    await expect(page.getByTestId('stock-status')).toHaveText(/Out of stock/i)
    await expect(page.getByTestId('add-to-cart').first()).toBeDisabled()
    await expect(page.getByTestId('add-to-cart').first()).toHaveText(/Out of stock/i)
  })

  test('checkout validates fields in the selected language', async ({ page }) => {
    await addHimsagar(page, 'bn')
    await page.goto('/bn/checkout')
    await page.getByTestId('place-order').click()
    await expect(page.locator('#name-error')).toBeVisible()
    await expect(page.locator('#phone-error')).toBeVisible()
    await page.locator('#phone').fill('12345')
    await page.getByTestId('place-order').click()
    await expect(page.locator('#phone-error')).toContainText(/[ঀ-৿]/) // Bangla message
  })

  test('cash-on-delivery order is created, shown and trackable', async ({ page }) => {
    await addHimsagar(page)
    await page.goto('/en/checkout')
    await page.locator('#name').fill('E2E Customer')
    await page.locator('#phone').fill('01712345678')
    await page.locator('#division').selectOption('dhaka')
    await page.locator('#district').selectOption('dhaka')
    await page.locator('#area').fill('Dhanmondi')
    await page.locator('#address').fill('House 1, Road 2, Dhanmondi, Dhaka')
    await page.getByTestId('pay-cod').check()
    await expect(page.getByTestId('checkout-total')).toContainText('৳')
    await page.getByTestId('place-order').click()
    await expect(page).toHaveURL(/\/en\/order\/[A-Z]+-\d{6}-[A-Z0-9]{5}\?t=/)
    const orderNumber = (await page.getByTestId('order-number').textContent())!.trim()
    await expect(page.getByTestId('order-status')).toBeVisible()
    await expect(page.getByTestId('cart-count')).toHaveCount(0)

    // Without the private token the order is NOT shown just because the number is known.
    await page.goto(`/en/order/${orderNumber}`)
    await expect(page.getByTestId('order-number')).toHaveCount(0)

    // Tracking with the phone number works.
    await page.goto('/en/track-order')
    await page.locator('#orderNumber').fill(orderNumber)
    await page.locator('#track-phone').fill('01712345678')
    await page.getByRole('button', { name: /Find order/i }).click()
    await expect(page.getByTestId('order-number')).toHaveText(orderNumber)
  })

  test('SEO basics: sitemap, robots, canonical and 404', async ({ page, request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('/bn/product/himsagar-mango')
    expect(sitemap).toContain('/en/product/himsagar-mango')
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toMatch(/Disallow: \/admin/)
    await page.goto('/en/category/mango')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/category\/mango$/)
    const res = await page.goto('/en/product/does-not-exist')
    expect(res?.status()).toBe(404)
  })
})

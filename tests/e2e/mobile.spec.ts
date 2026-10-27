import { expect, test } from '@playwright/test'

const widths = [320, 375, 430, 768]

test('mobile navigation opens, switches language and navigates', async ({ page }) => {
  await page.goto('/bn')
  await page.getByRole('button', { name: 'মেনু খুলুন' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('link', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en$/)
  await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Mangoes' }).click()
  await expect(page).toHaveURL(/\/en\/category\/mango/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const width of widths) {
  test(`no horizontal overflow at ${width}px (home, product, cart, checkout)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    for (const path of ['/bn', '/en/shop', '/bn/product/himsagar-mango', '/bn/cart', '/en/checkout']) {
      await page.goto(path)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test('the mobile product page keeps the add-to-cart button usable and clear of the WhatsApp button', async ({ page }) => {
  await page.goto('/bn/product/himsagar-mango')
  const add = page.getByTestId('add-to-cart').first()
  await expect(add).toBeVisible()
  const box = await add.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44) // touch target
  await add.click()
  await expect(page.getByTestId('cart-drawer')).toBeVisible()
})

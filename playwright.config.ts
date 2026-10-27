import { defineConfig, devices } from '@playwright/test'
import { e2eEnv } from './tests/e2e/env'

/**
 * End-to-end tests run against the PRODUCTION build (`npm run build` first) on port 3100, using an isolated
 * `<db>_e2e` database that tests/e2e/prepare-db.ts drops, migrates and seeds (`npm run test:e2e` runs both). No real payments or messages are sent:
 * only cash-on-delivery is enabled and gateway/SMTP credentials are stripped from the environment.
 * Set E2E_BASE_URL to test an already-running server instead (it must use a disposable database).
 */
const external = process.env.E2E_BASE_URL
const baseURL = external || 'http://127.0.0.1:3100'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'bn-BD',
    // Optional: use a system-provided Chromium instead of `npx playwright install` (e.g. on a locked-down CI box).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
  ],
  webServer: external
    ? undefined
    : {
        command: 'node scripts/start.mjs',
        url: `${baseURL}/bn`,
        timeout: 120_000,
        reuseExistingServer: false,
        env: e2eEnv(),
      },
})

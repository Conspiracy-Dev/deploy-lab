import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

const baseUrl = process.env.CONTACT_SMOKE_URL
assert.ok(baseUrl, 'Set CONTACT_SMOKE_URL to the disposable local origin')
const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' })

try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.locator('#contact').scrollIntoViewIfNeeded()
    const form = page.locator('#contact form')
    await form.locator('button[type="submit"]').click()
    await page.locator('input[name="name"][aria-invalid="true"]').waitFor()
    await form.locator('input[name="name"]').fill('Container browser test')
    await form.locator('input[name="email"]').fill('smoke@example.com')
    await form.locator('textarea[name="message"]').fill('Container-only browser smoke request')
    await form.locator('input[type="checkbox"]').check()
    const response = page.waitForResponse((item) => item.url().endsWith('/api/contact'))
    await form.locator('button[type="submit"]').click()
    assert.equal((await response).status(), 503)
    await form.locator('[role="alert"]').waitFor()
    assert.equal(await form.locator('input[name="email"]').inputValue(), 'smoke@example.com')
    assert.equal(
      await form.locator('textarea[name="message"]').inputValue(),
      'Container-only browser smoke request',
    )

    // Success rendering is isolated at the HTTP I/O boundary, never a live write.
    await page.route('**/api/contact', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'accepted' }),
      }),
    )
    await form.locator('button[type="submit"]').click()
    await page.locator('#contact [role="status"]').waitFor()
    await page.getByRole('button', { name: 'Start a new request' }).click()
    assert.equal(await form.locator('input[name="email"]').inputValue(), '')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.close()
  }
  process.stdout.write('Built-image Contact browser smoke passed at 390 and 1440 px.\n')
} finally {
  await browser.close()
}

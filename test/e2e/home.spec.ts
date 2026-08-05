import { expect, test } from '@playwright/test'

test('renders the semantic home route and its scene fallback boundary', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/DeployLab/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Full-cycle web')
  await expect(page.getByTestId('hero-scene')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('keeps the static scene fallback for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.locator('.hero__fallback')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

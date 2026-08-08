import { expect, test } from '@playwright/test'

test('renders the semantic home shell and its local hero visual', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/DeployLab/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Full-cycle web')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.locator('.home-hero-visual img')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('keeps the static local visual for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.locator('.home-hero-visual img')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('opens and closes mobile navigation with keyboard-safe native dialog behaviour', async ({
  page,
}) => {
  test.skip(
    test.info().project.name !== 'mobile-chrome',
    'The menu is only visible at the mobile breakpoint.',
  )

  await page.goto('/')

  const toggle = page.getByRole('button', { name: 'Open navigation' })
  await toggle.click()
  const dialog = page.getByRole('dialog', { name: 'Primary navigation' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Philosophy' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(toggle).toBeFocused()
})

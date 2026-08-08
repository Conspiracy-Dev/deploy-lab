import { expect, test } from '@playwright/test'

test('renders the approved Privacy Policy as an indexable semantic document', async ({ page }) => {
  const response = await page.goto('/privacy-policy')

  expect(response?.ok()).toBe(true)
  await expect(page).toHaveTitle('Privacy Policy | DeployLab')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Learn how DeployLab collects, uses, shares, retains and protects personal information when you use deploylab.io or contact us.',
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://deploylab.example/privacy-policy',
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'data-production-content',
    /index, follow/,
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy')
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(11)
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2)
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Deploy Lab home' }),
  ).toHaveAttribute('href', '/')
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.getByText('Last updated: August 8, 2026')).toBeVisible()
  await expect(page.getByText('We do not sell or rent your personal information')).toBeVisible()
  await expect(page.getByRole('link', { name: 'hello@deployteam.io' }).last()).toHaveAttribute(
    'href',
    'mailto:hello@deployteam.io',
  )
})

test('uses route-aware mobile navigation and does not overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile navigation assertion')

  await page.goto('/privacy-policy', { waitUntil: 'networkidle' })
  const menuButton = page.locator('.privacy-header__inner').getByRole('button')
  await menuButton.click()
  await expect(menuButton).toHaveAttribute('aria-label', 'Close navigation')

  const navigation = page.getByRole('dialog', { name: 'Primary navigation' })
  await expect(navigation).toBeVisible()
  await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute(
    'href',
    '/',
  )
  await expect(navigation.getByRole('link', { name: 'Philosophy' })).toHaveAttribute(
    'href',
    '/#philosophy',
  )

  await page.keyboard.press('Escape')
  await expect(navigation).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('links between the home footer and Privacy Policy brand', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy Policy' }).click()
  await expect(page).toHaveURL(/\/privacy-policy$/)

  await page.getByRole('banner').getByRole('link', { name: 'Deploy Lab home' }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('keeps the long-form layout fluid across supported widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One browser covers CSS viewport geometry')

  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/privacy-policy')

  for (const width of [320, 390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })

    const geometry = await page.evaluate(() => {
      const article = document.querySelector('article')?.getBoundingClientRect()
      const header = document.querySelector('header')?.getBoundingClientRect()

      return {
        articleWidth: Math.round(article?.width ?? 0),
        hasHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        headerHeight: Math.round(header?.height ?? 0),
      }
    })

    expect(geometry.hasHorizontalOverflow, `${width}px viewport`).toBe(false)
    expect(geometry.headerHeight, `${width}px header`).toBe(80)
    expect(geometry.articleWidth, `${width}px prose measure`).toBeLessThanOrEqual(840)
  }
})

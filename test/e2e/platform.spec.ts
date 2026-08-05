import { expect, test } from '@playwright/test'

test('serves SEO discovery endpoints and security headers', async ({ page }) => {
  const homeResponse = await page.goto('/')

  expect(homeResponse).not.toBeNull()
  expect(homeResponse?.headers()['content-security-policy']).toContain('script-src')
  expect(homeResponse?.headers()['x-content-type-options']).toBe('nosniff')

  const robotsResponse = await page.goto('/robots.txt')

  expect(robotsResponse).not.toBeNull()
  expect(robotsResponse?.headers()['content-type']).toContain('text/plain')
  await expect(page.locator('body')).toContainText('User-agent')

  const sitemapResponse = await page.goto('/sitemap.xml')

  expect(sitemapResponse).not.toBeNull()
  expect(sitemapResponse?.headers()['content-type']).toContain('xml')
  expect(await sitemapResponse?.text()).toContain('<urlset')
})

import { expect, test } from '@playwright/test'

test('serves SEO discovery endpoints and security headers', async ({ page, request }) => {
  const homeResponse = await page.goto('/')

  expect(homeResponse).not.toBeNull()
  expect(homeResponse?.headers()['content-security-policy']).toContain('script-src')
  expect(homeResponse?.headers()['x-content-type-options']).toBe('nosniff')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /DeployLab builds thoughtful web and mobile products/,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://deploylab.example/',
  )
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /DeployLab/)
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)

  const robotsResponse = await page.goto('/robots.txt')

  expect(robotsResponse).not.toBeNull()
  expect(robotsResponse?.headers()['content-type']).toContain('text/plain')
  await expect(page.locator('body')).toContainText('User-agent')

  const sitemapResponse = await request.get('/sitemap.xml')

  expect(sitemapResponse.ok()).toBe(true)
  expect(sitemapResponse.headers()['content-type']).toContain('xml')
  // The development server derives sitemap URLs from its local request origin.
  // The configured production fallback is asserted against the prerendered output.
  const sitemap = await sitemapResponse.text()

  expect(sitemap).toContain('<loc>http://127.0.0.1:3000/</loc>')
  expect(sitemap).toContain('<loc>http://127.0.0.1:3000/privacy-policy</loc>')
})

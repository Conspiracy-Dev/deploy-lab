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
  const sitemapOrigin = new URL(sitemapResponse.url()).origin

  expect(sitemap).toContain(`<loc>${sitemapOrigin}/</loc>`)
  expect(sitemap).toContain(`<loc>${sitemapOrigin}/privacy-policy</loc>`)
})

test.describe('share metadata without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('publishes shared images and preserves page metadata', async ({ page, request }) => {
    const origin = 'https://deploylab.example'
    const imagePath = '/images/social/deploylab-v1.png'
    const faviconPath = '/favicon-96.png'
    const routes = [
      {
        path: '/',
        title: 'DeployLab — full-cycle web and mobile development',
        description: /DeployLab builds thoughtful web and mobile products/,
      },
      {
        path: '/privacy-policy',
        title: 'Privacy Policy | DeployLab',
        description: /protects personal information/,
      },
    ]

    for (const { path, title, description } of routes) {
      await page.goto(path)

      const canonical = new URL(path, origin).href
      const imageUrl = new URL(imagePath, page.url()).href
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical)
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        description,
      )
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website')

      const metadata = [
        ['property', 'og:image', imageUrl],
        ['property', 'og:image:alt', /Deploy Lab/],
        ['property', 'og:image:type', 'image/png'],
        ['property', 'og:image:width', '1200'],
        ['property', 'og:image:height', '630'],
        ['name', 'twitter:card', 'summary_large_image'],
        ['name', 'twitter:image', imageUrl],
        ['name', 'twitter:image:alt', /Deploy Lab/],
      ] as const

      for (const [key, tag, value] of metadata) {
        await expect(page.locator(`meta[${key}="${tag}"]`)).toHaveAttribute('content', value)
      }

      const favicon = page.locator('link[rel="icon"]')
      await expect(favicon).toHaveAttribute('href', faviconPath)
      await expect(favicon).toHaveAttribute('type', 'image/png')
      await expect(favicon).toHaveAttribute('sizes', '96x96')
    }

    const pngFiles = [
      { path: imagePath, width: 1200, height: 630 },
      { path: faviconPath, width: 96, height: 96 },
    ]

    for (const { path, width, height } of pngFiles) {
      const response = await request.get(path)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('image/png')

      const png = await response.body()
      expect(png.toString('ascii', 12, 16)).toBe('IHDR')
      expect(png.readUInt32BE(16)).toBe(width)
      expect(png.readUInt32BE(20)).toBe(height)
    }

    const ico = await request.get('/favicon.ico')
    expect(ico.status()).toBe(200)
    expect(ico.headers()['content-type']).toMatch(/^image\/(vnd\.microsoft\.icon|x-icon)/)
  })
})

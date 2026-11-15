import { expect, test } from '@playwright/test'

test('shows the notice across pages until OK sets one session cookie', async ({
  page,
  context,
}) => {
  await page.goto('/')
  const notice = page.getByRole('complementary', { name: 'How we use cookies' })
  const privacyLink = notice.getByRole('link', { name: 'Privacy Policy' })
  await expect(notice).toBeVisible()
  expect(await context.cookies()).toEqual([])
  await page.keyboard.press('Tab')
  await expect(privacyLink).toBeFocused()

  await privacyLink.click()
  await expect(page).toHaveURL(/\/privacy-policy$/)
  await expect(notice).toBeVisible()
  expect(await context.cookies()).toEqual([])

  const otherTab = await context.newPage()
  const otherNotice = otherTab.getByRole('complementary', { name: 'How we use cookies' })
  await otherTab.goto('/', { waitUntil: 'networkidle' })
  await expect(otherNotice).toBeVisible()
  // A second tab can receive the dismissal before it sees the cookie change.
  await otherTab.evaluate(() => {
    Object.defineProperty(document, 'cookie', { get: () => '' })
  })
  await page.bringToFront()

  await page.waitForLoadState('networkidle')
  let requestCount = 0
  page.on('request', () => {
    requestCount += 1
  })
  await privacyLink.focus()
  await page.keyboard.press('Tab')
  const ok = notice.getByRole('button', { name: 'OK', exact: true })
  await expect(ok).toBeFocused()
  await expect(ok).toHaveCSS('outline-width', '2px')
  await page.keyboard.press('Enter')
  await expect(notice).toHaveCount(0)
  await expect(page.getByRole('main')).toBeFocused()
  expect(requestCount).toBe(0)

  const cookies = await context.cookies()
  expect(cookies).toHaveLength(1)
  expect(cookies[0]).toMatchObject({
    name: 'deploylab-cookie-notice',
    value: 'dismissed',
    expires: -1,
    path: '/',
    sameSite: 'Lax',
  })

  await page.reload({ waitUntil: 'networkidle' })
  await expect(notice).toHaveCount(0)

  await otherTab.bringToFront()
  await expect(otherNotice).toHaveCount(0)
  await otherTab.reload({ waitUntil: 'networkidle' })
  await expect(otherNotice).toHaveCount(0)
})

test('still closes the notice when the browser blocks cookie access', async ({ page, context }) => {
  await context.addInitScript(() => {
    function blockCookies(): never {
      throw new DOMException('Cookies are unavailable', 'SecurityError')
    }
    Object.defineProperty(document, 'cookie', { get: blockCookies, set: blockCookies })
  })

  await page.goto('/')
  const notice = page.getByRole('complementary', { name: 'How we use cookies' })
  await expect(notice).toBeVisible()
  await notice.getByRole('button', { name: 'OK', exact: true }).click()
  await expect(notice).toHaveCount(0)
  expect(await context.cookies()).toEqual([])

  await page.reload()
  await expect(notice).toBeVisible()
})

test('keeps the mobile menu and contact form usable while the notice is open', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile notice placement')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const notice = page.getByRole('complementary', { name: 'How we use cookies' })
  await expect(notice).toBeInViewport()

  await page.getByRole('button', { name: 'Open navigation' }).click()
  const menu = page.getByRole('dialog', { name: 'Primary navigation' })
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)

  await page.getByRole('link', { name: 'Start a Project', exact: true }).click()
  await expect(page).toHaveURL(/#contact$/)
  await expect(notice).not.toBeInViewport()
  const name = page.getByLabel('Name')
  await name.fill('Ada Lovelace')
  await expect(name).toBeFocused()
  await expect(name).toHaveValue('Ada Lovelace')

  const anchoredPage = await page.context().newPage()
  await anchoredPage.goto('/#contact')
  const anchoredNotice = anchoredPage.getByRole('complementary', { name: 'How we use cookies' })
  await expect(anchoredNotice).toBeVisible()
  await expect(anchoredNotice).not.toBeInViewport()
  await expect(anchoredPage.getByLabel('Name')).toBeInViewport()
})

test('keeps the Privacy Policy footer link above the fixed notice at the end of the page', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile footer clearance')
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/privacy-policy')

  const notice = page.getByRole('complementary', { name: 'How we use cookies' })
  const footerLink = page.getByRole('contentinfo').getByRole('link', { name: 'Privacy Policy' })
  await expect(notice).toBeInViewport()
  await footerLink.focus()
  await expect(footerLink).toBeFocused()
  await expect
    .poll(async () => {
      const link = await footerLink.boundingBox()
      const banner = await notice.boundingBox()
      return Boolean(link && banner && link.y >= 0 && link.y + link.height < banner.y)
    })
    .toBe(true)
  await footerLink.click({ trial: true })
})

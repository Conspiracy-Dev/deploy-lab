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

test('renders the implemented Philosophy and Services landmarks with local Figma visuals', async ({
  page,
}) => {
  await page.goto('/')

  const philosophy = page.locator('#philosophy')
  const services = page.locator('#services')

  await expect(philosophy.getByRole('heading', { level: 2 })).toContainText(
    'We deliver complete products',
  )
  await expect(philosophy.locator('li')).toHaveCount(3)
  await expect(philosophy.locator('img[alt=""]')).toHaveCount(3)

  await expect(services.getByRole('heading', { level: 2 })).toContainText('What We Do')
  await expect(services.locator('li')).toHaveCount(6)
  await expect(services.locator('img[alt=""]')).toHaveCount(7)
  await expect(page.locator('a[href="#philosophy"]').first()).toHaveText('Philosophy')
  await expect(page.locator('a[href="#services"]').first()).toHaveText('Services')
})

test('keeps the static local visual for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  await expect(page.locator('.home-hero-visual img')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('renders Projects and Process landmarks with manual project collection semantics', async ({
  page,
}) => {
  await page.goto('/')

  const projects = page.locator('#projects')
  const process = page.locator('#process')

  await expect(projects.getByRole('heading', { level: 2 })).toContainText('Selected Projects')
  await expect(projects.locator('.home-projects__list > li')).toHaveCount(6)
  await expect(projects.locator('.home-projects__list')).toHaveAttribute('tabindex', '0')
  await expect(projects.locator('a[href="https://quantumready.info"]')).toHaveAttribute(
    'target',
    '_blank',
  )
  await expect(process.getByRole('heading', { level: 2 })).toContainText('How We Work')
  await expect(process.locator('ol > li')).toHaveCount(7)
  await expect(page.locator('a[href="#projects"]').first()).toHaveText('Selected Projects')
  await expect(page.locator('a[href="#process"]').first()).toHaveText('Process')
})

test('renders Feedback and a visual-only Contact boundary', async ({ page }) => {
  await page.goto('/')

  const feedback = page.locator('#feedback')
  const contact = page.locator('#contact')

  await expect(feedback.getByRole('heading', { level: 2 })).toContainText('Client')
  await expect(feedback.locator('.home-feedback__list > li')).toHaveCount(3)
  await expect(feedback.locator('.home-feedback__list')).toHaveAttribute('tabindex', '0')
  await expect(page.locator('a[href="#feedback"]').first()).toHaveText('Feedback')

  await expect(contact.getByRole('heading', { level: 2 })).toHaveText('Start a Project')
  await contact.getByLabel('Name').fill('Ada Lovelace')
  await contact.getByLabel('Email').fill('ada@example.com')
  await contact.getByLabel('Message').fill('A visual-only request.')
  await contact.getByLabel(/I agree to the Privacy Policy/).check()
  await expect(contact.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
    'href',
    '/privacy-policy',
  )

  await contact.getByRole('button', { name: 'Send request' }).click()
  await expect(contact.getByRole('button', { name: 'Send request' })).toHaveAttribute(
    'type',
    'button',
  )
  await expect(contact.locator('[role="status"]')).toHaveCount(0)
  await expect(page).toHaveURL(/\/$/)
})

test('keeps a semantic section heading sequence and avoids narrow-document overflow', async ({
  page,
}) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(
      page.locator('main > section').last().getByRole('heading', { level: 2 }),
    ).toHaveText('Start a Project')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  }
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

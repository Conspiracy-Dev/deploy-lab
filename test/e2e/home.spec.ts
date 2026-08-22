import { expect, test } from '@playwright/test'

test('renders the semantic home shell and its local hero visual', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/DeployLab/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Full-cycle web')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await expect(page.locator('.home-hero-visual img')).toBeVisible()
  await expect(page.locator('.home-hero-visual img')).toHaveAttribute('loading', 'eager')
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('keeps the desktop header as a distinct Figma-height band before Hero', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'The measured desktop header/Hero relationship belongs to the desktop endpoint.',
  )

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  expect(
    await page.evaluate(() => {
      const header = document.querySelector('.home-header')!.getBoundingClientRect()
      const hero = document.querySelector('.home-hero')!.getBoundingClientRect()
      const copy = document.querySelector('.home-hero__copy')!.getBoundingClientRect()

      return (
        header.height === 80 &&
        hero.top === header.bottom &&
        Math.abs(copy.top - (hero.top + (hero.height - copy.height) / 2)) <= 1
      )
    }),
  ).toBe(true)
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

  await services.scrollIntoViewIfNeeded()
  await expect
    .poll(() =>
      services.evaluate((section) => {
        const [eyebrow, title, description] =
          section.querySelector('.home-services__intro')!.children
        const eyebrowBox = eyebrow!.getBoundingClientRect()
        const titleBox = title!.getBoundingClientRect()
        const descriptionBox = description!.getBoundingClientRect()
        const expectedGap = window.innerWidth >= 1024 ? 20 : 10

        return (
          Math.round(titleBox.top - eyebrowBox.bottom) === expectedGap &&
          Math.round(descriptionBox.top - titleBox.bottom) === expectedGap
        )
      }),
    )
    .toBe(true)
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
  await expect(projects.getByText('[Portfolio]')).toBeVisible()
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

  await projects.scrollIntoViewIfNeeded()
  const firstProjectImage = projects.locator('.case-card__image img').first()

  await expect
    .poll(() => firstProjectImage.evaluate((image) => image.complete && image.naturalWidth > 0), {
      timeout: 15_000,
    })
    .toBe(true)
  await expect
    .poll(
      () =>
        firstProjectImage.evaluate((image) => {
          const box = image.getBoundingClientRect()
          const sourceWidth = Number(image.currentSrc.match(/s_(\d+)x/)?.[1])

          return (
            image.currentSrc.includes('q_80') &&
            sourceWidth >= Math.ceil(box.width * window.devicePixelRatio)
          )
        }),
      { timeout: 15_000 },
    )
    .toBe(true)
})

test('renders Feedback and a visual-only Contact boundary', async ({ page }) => {
  await page.goto('/')

  const feedback = page.locator('#feedback')
  const contact = page.locator('#contact')

  await expect(feedback.getByRole('heading', { level: 2 })).toContainText('Client')
  await expect(feedback.locator('.home-feedback__list > li')).toHaveCount(3)
  await expect(feedback.locator('.home-feedback__list')).toHaveAttribute('tabindex', '0')
  await expect(feedback).toHaveCSS('overflow', 'hidden')
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

test('keeps Feedback free of a widescreen canvas artifact', async ({ page }) => {
  test.skip(
    test.info().project.name !== 'chromium',
    'The reported canvas artifact is specific to the widescreen desktop viewport.',
  )

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')

  const feedback = page.locator('#feedback')
  await feedback.scrollIntoViewIfNeeded()

  await expect(feedback).toHaveCSS('overflow', 'hidden')
  await expect(page.locator('.home-feedback__wireframe')).toHaveCSS(
    'background-color',
    'rgba(0, 0, 0, 0)',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1920)
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

  const close = dialog.getByRole('button', { name: 'Close navigation' })
  await expect(close).toBeVisible()
  await close.click()
  await expect(dialog).not.toBeVisible()
  await expect(toggle).toBeFocused()

  await toggle.press('Enter')
  await expect(dialog).toBeVisible()
  await close.press('Space')
  await expect(dialog).not.toBeVisible()
  await expect(toggle).toBeFocused()

  await toggle.click()
  const closeBox = await close.boundingBox()
  await page.touchscreen.tap(closeBox!.x + closeBox!.width / 2, closeBox!.y + closeBox!.height / 2)
  await expect(dialog).not.toBeVisible()
  await expect(toggle).toBeFocused()

  await toggle.click()
  await dialog.getByRole('link', { name: 'Feedback' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page).toHaveURL(/#feedback$/)

  await toggle.click()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(toggle).toBeFocused()
})

import { expect, test } from '@playwright/test'

test('exposes UI-kit states only from the development fixture route', async ({ page }) => {
  await page.goto('/__ui-kit')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('UI kit controls')
  await expect(page.getByRole('button', { name: 'Start a Project' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Disabled' })).toBeDisabled()

  const company = page.getByRole('textbox', { name: 'Company name', exact: true })
  await company.fill('DeployLab')
  await expect(company).toHaveValue('DeployLab')

  const details = page.getByRole('textbox', { name: 'Project details', exact: true })
  await details.fill('Accessible UI primitives')
  await expect(details).toHaveValue('Accessible UI primitives')

  const consent = page.getByRole('checkbox', { name: 'I agree to be contacted' })
  await consent.check()
  await expect(consent).toBeChecked()

  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await expect(
    page.getByRole('status').filter({ hasText: 'Submitted successfully!' }),
  ).toContainText('Submitted successfully!')
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const privacyPolicySource = readFileSync(
  resolve(process.cwd(), 'content/legal/privacy-policy.md'),
  'utf8',
)

describe('Privacy Policy content contract', () => {
  it('keeps the approved date, contact and complete section outline', () => {
    expect(privacyPolicySource).toContain('lastUpdated: August 8, 2026')
    expect(privacyPolicySource).toContain('hello@deployteam.io')
    expect(privacyPolicySource.match(/^## /gm)).toHaveLength(11)
    expect(privacyPolicySource.match(/^### /gm)).toHaveLength(2)
    expect(privacyPolicySource).not.toContain('[current date]')
    expect(privacyPolicySource).not.toContain('[add contact email]')
  })
})

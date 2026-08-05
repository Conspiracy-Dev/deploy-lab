import { describe, expect, it } from 'vitest'
import { normalizeSiteUrl } from '../../shared/utils/site-url'

describe('normalizeSiteUrl', () => {
  it('keeps only an HTTP(S) origin', () => {
    expect(normalizeSiteUrl('https://deploylab.example/path/')).toBe('https://deploylab.example')
  })

  it('rejects unsupported or malformed URLs', () => {
    expect(normalizeSiteUrl('ftp://deploylab.example')).toBeUndefined()
    expect(normalizeSiteUrl('not a URL')).toBeUndefined()
  })
})

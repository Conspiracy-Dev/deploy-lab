import { describe, expect, it } from 'vitest'
import {
  createContactRateLimiter,
  getContactClientAddress,
} from '../../server/utils/contact-rate-limiter'

describe('Contact rate limiter', () => {
  it('direct connection → ignores a spoofed forwarded address', () => {
    expect(
      getContactClientAddress({
        forwardedFor: '198.51.100.24',
        remoteAddress: '203.0.113.8',
        trustProxy: false,
      }),
    ).toBe('203.0.113.8')
  })

  it('trusted proxy → uses the first forwarded address', () => {
    expect(
      getContactClientAddress({
        forwardedFor: '198.51.100.24, 203.0.113.8',
        remoteAddress: '203.0.113.8',
        trustProxy: true,
      }),
    ).toBe('198.51.100.24')
  })

  it('sixth request in fifteen minutes → returns a retry delay', () => {
    let timestamp = 0
    const limiter = createContactRateLimiter(() => timestamp)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(limiter.consume('203.0.113.8').allowed).toBe(true)
    }

    timestamp = 1_000
    expect(limiter.consume('203.0.113.8')).toEqual({
      allowed: false,
      retryAfterSeconds: 899,
    })
  })

  it('window expiry → permits a new request', () => {
    let timestamp = 0
    const limiter = createContactRateLimiter(() => timestamp)

    for (let attempt = 0; attempt < 5; attempt += 1) {
      limiter.consume('203.0.113.8')
    }

    timestamp = 15 * 60 * 1_000
    expect(limiter.consume('203.0.113.8')).toEqual({ allowed: true, retryAfterSeconds: 0 })
  })
})

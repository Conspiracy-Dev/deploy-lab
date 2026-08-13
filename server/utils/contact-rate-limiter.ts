const CONTACT_RATE_LIMIT = 5
const CONTACT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000
const UNKNOWN_CLIENT_ADDRESS = 'unknown'

export interface ContactRateLimiter {
  consume(clientAddress: string): ContactRateLimitResult
}

export interface ContactRateLimitResult {
  readonly allowed: boolean
  readonly retryAfterSeconds: number
}

export interface ContactClientAddressInput {
  readonly forwardedFor?: string
  readonly remoteAddress?: string
  readonly trustProxy: boolean
}

interface ContactRateLimitEntry {
  readonly attempts: number
  readonly windowStartedAt: number
}

/** Resolves the trusted proxy boundary before using an address as a rate-limit key. */
export function getContactClientAddress(input: ContactClientAddressInput): string {
  if (input.trustProxy) {
    const forwardedAddress = input.forwardedFor?.split(',')[0]?.trim()

    if (forwardedAddress) {
      return forwardedAddress
    }
  }

  return input.remoteAddress?.trim() || UNKNOWN_CLIENT_ADDRESS
}

/** Creates the single-process contact-form limiter approved for the current Node deployment. */
export function createContactRateLimiter(now: () => number = Date.now): ContactRateLimiter {
  const entries = new Map<string, ContactRateLimitEntry>()

  return {
    consume(clientAddress: string): ContactRateLimitResult {
      const timestamp = now()
      const key = clientAddress || UNKNOWN_CLIENT_ADDRESS
      const entry = entries.get(key)

      if (!entry || timestamp - entry.windowStartedAt >= CONTACT_RATE_LIMIT_WINDOW_MS) {
        entries.set(key, {
          attempts: 1,
          windowStartedAt: timestamp,
        })
        return { allowed: true, retryAfterSeconds: 0 }
      }

      if (entry.attempts >= CONTACT_RATE_LIMIT) {
        return {
          allowed: false,
          retryAfterSeconds: getRetryAfterSeconds(entry.windowStartedAt, timestamp),
        }
      }

      entries.set(key, {
        attempts: entry.attempts + 1,
        windowStartedAt: entry.windowStartedAt,
      })
      return { allowed: true, retryAfterSeconds: 0 }
    },
  }
}

function getRetryAfterSeconds(windowStartedAt: number, timestamp: number): number {
  const remainingMs = CONTACT_RATE_LIMIT_WINDOW_MS - (timestamp - windowStartedAt)

  return Math.max(1, Math.ceil(remainingMs / 1_000))
}

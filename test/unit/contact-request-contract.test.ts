import { describe, expect, it } from 'vitest'
import {
  contactAcceptedResponseSchema,
  contactErrorResponseSchema,
  contactInvalidRequestResponseSchema,
  contactRequestSchema,
  getInvalidContactFields,
} from '../../shared/contracts/contact-request'

const VALID_REQUEST = {
  consent: true,
  email: ' hello@example.com ',
  message: ' I would like to discuss a new product. ',
  name: ' Ada Lovelace ',
  website: '',
}

describe('Contact request contract', () => {
  it('whitespace-padded valid input → returns trimmed request', () => {
    expect(contactRequestSchema.parse(VALID_REQUEST)).toEqual({
      consent: true,
      email: 'hello@example.com',
      message: 'I would like to discuss a new product.',
      name: 'Ada Lovelace',
      website: '',
    })
  })

  it.each([
    ['name', { ...VALID_REQUEST, name: 'A' }],
    ['email', { ...VALID_REQUEST, email: 'not-an-email' }],
    ['message', { ...VALID_REQUEST, message: 'Too short' }],
    ['consent', { ...VALID_REQUEST, consent: false }],
    ['website', { ...VALID_REQUEST, website: 7 }],
  ] as const)('invalid %s → reports only its public field name', (field, request) => {
    const result = contactRequestSchema.safeParse(request)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(getInvalidContactFields(result.error)).toEqual([field])
    }
  })

  it('unknown JSON property → rejects the request without exposing an invented field', () => {
    const result = contactRequestSchema.safeParse({ ...VALID_REQUEST, role: 'admin' })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(getInvalidContactFields(result.error)).toEqual([])
    }
  })

  it('public route responses → accept only the approved safe shapes', () => {
    expect(contactAcceptedResponseSchema.safeParse({ status: 'accepted' }).success).toBe(true)
    expect(
      contactInvalidRequestResponseSchema.safeParse({
        error: 'invalid_request',
        fields: ['email'],
      }).success,
    ).toBe(true)
    expect(contactErrorResponseSchema.safeParse({ error: 'service_unavailable' }).success).toBe(
      true,
    )
    expect(contactErrorResponseSchema.safeParse({ error: 'notion_unauthorized' }).success).toBe(
      false,
    )
  })
})

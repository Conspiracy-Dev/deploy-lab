import { z } from 'zod'

const CONTACT_FIELDS = ['name', 'email', 'message', 'consent', 'website'] as const

export const contactRequestSchema = z
  .object({
    consent: z.literal(true),
    email: z.string().trim().email().max(200),
    message: z.string().trim().min(10).max(2_000),
    name: z.string().trim().min(2).max(100),
    website: z.string().max(200),
  })
  .strict()

export const contactAcceptedResponseSchema = z.object({
  status: z.literal('accepted'),
})

export const contactInvalidRequestResponseSchema = z.object({
  error: z.literal('invalid_request'),
  fields: z.array(z.enum(CONTACT_FIELDS)),
})

export const contactErrorResponseSchema = z.object({
  error: z.enum([
    'invalid_origin',
    'payload_too_large',
    'rate_limited',
    'service_unavailable',
    'unsupported_media_type',
  ]),
})

export type ContactRequest = z.infer<typeof contactRequestSchema>

export type ContactField = (typeof CONTACT_FIELDS)[number]

export function getInvalidContactFields(error: z.ZodError): ContactField[] {
  const fields = new Set<ContactField>()

  for (const issue of error.issues) {
    const field = issue.path[0]

    if (typeof field === 'string' && isContactField(field)) {
      fields.add(field)
    }
  }

  return [...fields]
}

function isContactField(value: string): value is ContactField {
  return CONTACT_FIELDS.includes(value as ContactField)
}

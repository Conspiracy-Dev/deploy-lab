import { getRequestHeader, readRawBody, setResponseHeader, setResponseStatus } from 'h3'
import {
  type ContactField,
  type ContactRequest,
  contactRequestSchema,
  getInvalidContactFields,
} from '../../shared/contracts/contact-request'
import { createNotionContactRequestsAdapter } from '../integrations/notion/contact-requests'
import { writeContactDeliveryFailureDiagnostic } from '../utils/contact-diagnostics'
import { createContactRateLimiter, getContactClientAddress } from '../utils/contact-rate-limiter'

const CONTACT_MAX_BODY_BYTES = 8_192
const JSON_CONTENT_TYPE = 'application/json'
const contactRateLimiter = createContactRateLimiter()

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const preparedRequest = await prepareContactRequest(event, runtimeConfig)

  if (!preparedRequest.success) {
    return preparedRequest.response
  }

  if (preparedRequest.request.website) {
    return sendAcceptedResponse(event)
  }

  const adapter = createNotionContactRequestsAdapter({
    dataSourceId: runtimeConfig.notionDataSourceId,
    token: runtimeConfig.notionToken,
  })
  const result = await adapter.createContactRequest(toNotionContactRequest(preparedRequest.request))

  if (result.status === 'failure') {
    writeContactDeliveryFailureDiagnostic(result)
    return sendErrorResponse(event, 503, 'service_unavailable')
  }

  return sendAcceptedResponse(event)
})

interface ContactRuntimeConfig {
  readonly notionDataSourceId: string
  readonly notionToken: string
  readonly public: {
    readonly siteUrl: string
  }
  readonly trustProxy: boolean
}

type ContactErrorCode =
  | 'invalid_origin'
  | 'invalid_request'
  | 'payload_too_large'
  | 'rate_limited'
  | 'service_unavailable'
  | 'unsupported_media_type'

type ContactResponse =
  | { readonly error: Exclude<ContactErrorCode, 'invalid_request'> }
  | { readonly error: 'invalid_request'; readonly fields: ContactField[] }
  | { readonly status: 'accepted' }

type PreparedContactRequest =
  | { readonly request: ContactRequest; readonly success: true }
  | { readonly response: ContactResponse; readonly success: false }

async function prepareContactRequest(
  event: Parameters<typeof setResponseStatus>[0],
  runtimeConfig: ContactRuntimeConfig,
): Promise<PreparedContactRequest> {
  const rejectedRequest = await getRejectedRequest(event, runtimeConfig)

  if (rejectedRequest) {
    return { response: rejectedRequest, success: false }
  }

  const rawBody = await readRawBody(event)

  if (!rawBody || Buffer.byteLength(rawBody, 'utf8') > CONTACT_MAX_BODY_BYTES) {
    return { response: sendErrorResponse(event, 413, 'payload_too_large'), success: false }
  }

  const parsedJson = parseJson(rawBody)

  if (!parsedJson.success) {
    return { response: sendErrorResponse(event, 400, 'invalid_request', []), success: false }
  }

  const request = contactRequestSchema.safeParse(parsedJson.data)

  if (!request.success) {
    return {
      response: sendErrorResponse(
        event,
        400,
        'invalid_request',
        getInvalidContactFields(request.error),
      ),
      success: false,
    }
  }

  return { request: request.data, success: true }
}

async function getRejectedRequest(
  event: Parameters<typeof setResponseStatus>[0],
  runtimeConfig: ContactRuntimeConfig,
): Promise<ContactResponse | undefined> {
  if (!hasJsonContentType(getRequestHeader(event, 'content-type'))) {
    return sendErrorResponse(event, 415, 'unsupported_media_type')
  }

  if (
    !runtimeConfig.public.siteUrl ||
    getRequestHeader(event, 'origin') !== runtimeConfig.public.siteUrl
  ) {
    return sendErrorResponse(event, 403, 'invalid_origin')
  }

  const clientAddress = getContactClientAddress({
    forwardedFor: getRequestHeader(event, 'x-forwarded-for'),
    remoteAddress: event.node.req.socket.remoteAddress,
    trustProxy: runtimeConfig.trustProxy === true,
  })
  const rateLimit = contactRateLimiter.consume(clientAddress)

  if (rateLimit.allowed) {
    return undefined
  }

  setResponseHeader(event, 'Retry-After', rateLimit.retryAfterSeconds)
  return sendErrorResponse(event, 429, 'rate_limited')
}

function hasJsonContentType(contentType: string | undefined): boolean {
  return contentType?.toLowerCase().startsWith(JSON_CONTENT_TYPE) ?? false
}

function parseJson(
  value: string,
): { readonly data: unknown; readonly success: true } | { readonly success: false } {
  try {
    return {
      data: JSON.parse(value),
      success: true,
    }
  } catch {
    return { success: false }
  }
}

function toNotionContactRequest(request: ContactRequest) {
  return {
    email: request.email,
    message: request.message,
    name: request.name,
  }
}

function sendAcceptedResponse(event: Parameters<typeof setResponseStatus>[0]) {
  setResponseStatus(event, 201)
  return { status: 'accepted' as const }
}

function sendErrorResponse(
  event: Parameters<typeof setResponseStatus>[0],
  statusCode: 400 | 403 | 413 | 415 | 429 | 503,
  error: ContactErrorCode,
  fields?: ContactField[],
): ContactResponse {
  setResponseStatus(event, statusCode)

  if (error === 'invalid_request') {
    return { error, fields: fields ?? [] }
  }

  return { error }
}

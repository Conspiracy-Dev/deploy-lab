import { z } from 'zod'

const DEFAULT_RETRY_AFTER_MS = 1_000
const MAX_RETRY_AFTER_MS = 5_000
const NOTION_API_VERSION = '2026-03-11'
const NOTION_CREATE_PAGE_URL = 'https://api.notion.com/v1/pages'
const NOTION_REQUEST_TIMEOUT_MS = 10_000

const notionContactRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(2_000),
})

const notionCreatePageResponseSchema = z.object({
  id: z.string().min(1),
})

type NotionContactRequest = z.infer<typeof notionContactRequestSchema>

export type NotionDeliveryErrorClass =
  'configuration' | 'invalid_input' | 'unauthorized' | 'rate_limited' | 'timeout' | 'unavailable'

interface NotionDeliverySuccess {
  readonly durationMs: number
  readonly requestId: string
  readonly status: 'success'
}

export interface NotionDeliveryFailure {
  readonly durationMs: number
  readonly errorClass: NotionDeliveryErrorClass
  readonly requestId: string
  readonly status: 'failure'
}

export type NotionDeliveryResult = NotionDeliveryFailure | NotionDeliverySuccess

interface NotionCreatePageRequest {
  readonly parent: {
    readonly data_source_id: string
  }
  readonly properties: {
    readonly Email: {
      readonly email: string
    }
    readonly Message: {
      readonly rich_text: readonly NotionRichText[]
    }
    readonly Name: {
      readonly title: readonly NotionRichText[]
    }
    readonly Status: {
      readonly status: {
        readonly name: 'New'
      }
    }
  }
}

interface NotionRichText {
  readonly text: {
    readonly content: string
  }
  readonly type: 'text'
}

export interface NotionFetchOptions {
  readonly body: NotionCreatePageRequest
  readonly headers: Record<string, string>
  readonly method: 'POST'
  readonly timeout: number
}

export type NotionFetch = (url: string, options: NotionFetchOptions) => Promise<unknown>

export interface NotionContactRequestsAdapterOptions {
  readonly dataSourceId: string
  readonly request?: NotionFetch
  readonly requestId?: () => string
  readonly sleep?: (durationMs: number) => Promise<void>
  readonly token: string
}

/**
 * Creates a server-only adapter for persisting a validated contact request.
 * Its result is safe for the future HTTP layer to classify and log.
 */
export function createNotionContactRequestsAdapter(options: NotionContactRequestsAdapterOptions) {
  const request = options.request ?? requestNotion
  const requestId = options.requestId ?? createRequestId
  const sleep = options.sleep ?? wait

  return {
    async createContactRequest(input: unknown): Promise<NotionDeliveryResult> {
      const startedAt = Date.now()
      const id = requestId()

      if (!hasConfiguration(options)) {
        return createFailure('configuration', id, startedAt)
      }

      const parsedInput = notionContactRequestSchema.safeParse(input)

      if (!parsedInput.success) {
        return createFailure('invalid_input', id, startedAt)
      }

      return submitRequest({
        dataSourceId: options.dataSourceId.trim(),
        input: parsedInput.data,
        request,
        requestId: id,
        sleep,
        startedAt,
        token: options.token.trim(),
      })
    },
  }
}

interface SubmitRequestOptions {
  readonly dataSourceId: string
  readonly input: NotionContactRequest
  readonly request: NotionFetch
  readonly requestId: string
  readonly sleep: (durationMs: number) => Promise<void>
  readonly startedAt: number
  readonly token: string
}

async function submitRequest(options: SubmitRequestOptions): Promise<NotionDeliveryResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await options.request(NOTION_CREATE_PAGE_URL, {
        body: createNotionPageBody(options.dataSourceId, options.input),
        headers: {
          Authorization: `Bearer ${options.token}`,
          'Content-Type': 'application/json',
          'Notion-Version': NOTION_API_VERSION,
        },
        method: 'POST',
        timeout: NOTION_REQUEST_TIMEOUT_MS,
      })

      if (!notionCreatePageResponseSchema.safeParse(response).success) {
        return createFailure('unavailable', options.requestId, options.startedAt)
      }

      return {
        durationMs: getDuration(options.startedAt),
        requestId: options.requestId,
        status: 'success',
      }
    } catch (error: unknown) {
      const status = getHttpStatus(error)

      if (status === 429 && attempt === 0) {
        await options.sleep(getRetryAfterMs(error))
        continue
      }

      return createFailure(getErrorClass(error, status), options.requestId, options.startedAt)
    }
  }

  return createFailure('rate_limited', options.requestId, options.startedAt)
}

function createNotionPageBody(
  dataSourceId: string,
  input: NotionContactRequest,
): NotionCreatePageRequest {
  return {
    parent: {
      data_source_id: dataSourceId,
    },
    properties: {
      Email: {
        email: input.email,
      },
      Message: {
        rich_text: [createRichText(input.message)],
      },
      Name: {
        title: [createRichText(input.name)],
      },
      Status: {
        status: {
          name: 'New',
        },
      },
    },
  }
}

function createRichText(content: string): NotionRichText {
  return {
    text: {
      content,
    },
    type: 'text',
  }
}

function createFailure(
  errorClass: NotionDeliveryErrorClass,
  requestId: string,
  startedAt: number,
): NotionDeliveryFailure {
  return {
    durationMs: getDuration(startedAt),
    errorClass,
    requestId,
    status: 'failure',
  }
}

function createRequestId(): string {
  return globalThis.crypto.randomUUID()
}

function getDuration(startedAt: number): number {
  return Date.now() - startedAt
}

function getErrorClass(error: unknown, status: number | undefined): NotionDeliveryErrorClass {
  if (status === 401 || status === 403 || status === 404) {
    return 'unauthorized'
  }

  if (status === 429) {
    return 'rate_limited'
  }

  if (isTimeoutError(error)) {
    return 'timeout'
  }

  return 'unavailable'
}

function getHttpStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined
  }

  const status = error.statusCode ?? error.status

  if (typeof status === 'number') {
    return status
  }

  if (!isRecord(error.response) || typeof error.response.status !== 'number') {
    return undefined
  }

  return error.response.status
}

function getRetryAfterMs(error: unknown): number {
  if (!isRecord(error) || !isRecord(error.response)) {
    return DEFAULT_RETRY_AFTER_MS
  }

  const headers = error.response.headers

  if (!isHeaders(headers)) {
    return DEFAULT_RETRY_AFTER_MS
  }

  const seconds = Number(headers.get('retry-after'))

  if (!Number.isFinite(seconds) || seconds < 0) {
    return DEFAULT_RETRY_AFTER_MS
  }

  return Math.min(seconds * 1_000, MAX_RETRY_AFTER_MS)
}

function hasConfiguration(options: NotionContactRequestsAdapterOptions): boolean {
  return options.dataSourceId.trim().length > 0 && options.token.trim().length > 0
}

function isHeaders(value: unknown): value is Pick<Headers, 'get'> {
  return isRecord(value) && typeof value.get === 'function'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isTimeoutError(error: unknown): boolean {
  return isRecord(error) && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

async function requestNotion(url: string, options: NotionFetchOptions): Promise<unknown> {
  return $fetch(url, options)
}

async function wait(durationMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

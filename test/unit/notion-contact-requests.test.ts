import { describe, expect, it } from 'vitest'
import {
  createNotionContactRequestsAdapter,
  type NotionFetch,
  type NotionFetchOptions,
} from '../../server/integrations/notion/contact-requests'

const VALID_CONTACT_REQUEST = {
  email: 'hello@example.com',
  message: 'I would like to discuss a new product.',
  name: 'Ada Lovelace',
}

const DATA_SOURCE_ID = 'data-source-id'
const REQUEST_ID = 'request-id'
const TOKEN = 'notion-token'

describe('Notion contact requests adapter', () => {
  it('valid request → maps the five approved properties', async () => {
    const calls: Array<{ readonly options: NotionFetchOptions; readonly url: string }> = []
    const request: NotionFetch = async (url, options) => {
      calls.push({ options, url })
      return { id: 'notion-page-id' }
    }
    const adapter = createAdapter({ request })

    await expect(adapter.createContactRequest(VALID_CONTACT_REQUEST)).resolves.toMatchObject({
      requestId: REQUEST_ID,
      status: 'success',
    })
    expect(calls).toEqual([
      {
        options: {
          body: {
            parent: {
              data_source_id: DATA_SOURCE_ID,
            },
            properties: {
              Email: {
                email: VALID_CONTACT_REQUEST.email,
              },
              Message: {
                rich_text: [
                  {
                    text: {
                      content: VALID_CONTACT_REQUEST.message,
                    },
                    type: 'text',
                  },
                ],
              },
              Name: {
                title: [
                  {
                    text: {
                      content: VALID_CONTACT_REQUEST.name,
                    },
                    type: 'text',
                  },
                ],
              },
              Status: {
                status: {
                  name: 'New',
                },
              },
            },
          },
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2026-03-11',
          },
          method: 'POST',
          timeout: 10_000,
        },
        url: 'https://api.notion.com/v1/pages',
      },
    ])
  })

  it('missing credentials → returns configuration failure without a request', async () => {
    let requestCount = 0
    const request: NotionFetch = async () => {
      requestCount += 1
      return { id: 'notion-page-id' }
    }
    const adapter = createAdapter({ request, token: ' ' })

    await expect(adapter.createContactRequest(VALID_CONTACT_REQUEST)).resolves.toMatchObject({
      errorClass: 'configuration',
      requestId: REQUEST_ID,
      status: 'failure',
    })
    expect(requestCount).toBe(0)
  })

  it('invalid request → returns invalid input failure without a request', async () => {
    let requestCount = 0
    const request: NotionFetch = async () => {
      requestCount += 1
      return { id: 'notion-page-id' }
    }
    const adapter = createAdapter({ request })

    await expect(
      adapter.createContactRequest({ ...VALID_CONTACT_REQUEST, message: 'Too short' }),
    ).resolves.toMatchObject({
      errorClass: 'invalid_input',
      requestId: REQUEST_ID,
      status: 'failure',
    })
    expect(requestCount).toBe(0)
  })

  it.each([401, 403])('Notion %i → returns unauthorized failure', async (status) => {
    const adapter = createAdapter({
      request: async () => {
        throw createResponseError(status)
      },
    })

    await expect(adapter.createContactRequest(VALID_CONTACT_REQUEST)).resolves.toMatchObject({
      errorClass: 'unauthorized',
      status: 'failure',
    })
  })

  it('Notion 429 → waits once for Retry-After and retries', async () => {
    const retryDelays: number[] = []
    let requestCount = 0
    const adapter = createAdapter({
      request: async () => {
        requestCount += 1

        if (requestCount === 1) {
          throw createResponseError(429, '2')
        }

        return { id: 'notion-page-id' }
      },
      sleep: async (durationMs) => {
        retryDelays.push(durationMs)
      },
    })

    await expect(adapter.createContactRequest(VALID_CONTACT_REQUEST)).resolves.toMatchObject({
      status: 'success',
    })
    expect(requestCount).toBe(2)
    expect(retryDelays).toEqual([2_000])
  })

  it('timeout → returns timeout failure without retrying', async () => {
    let requestCount = 0
    const adapter = createAdapter({
      request: async () => {
        requestCount += 1
        throw { name: 'TimeoutError' }
      },
    })

    await expect(adapter.createContactRequest(VALID_CONTACT_REQUEST)).resolves.toMatchObject({
      errorClass: 'timeout',
      status: 'failure',
    })
    expect(requestCount).toBe(1)
  })

  it('Notion 5xx → returns unavailable failure without retrying', async () => {
    let requestCount = 0
    const adapter = createAdapter({
      request: async () => {
        requestCount += 1
        throw createResponseError(503)
      },
    })

    await expect(adapter.createContactRequest(VALID_CONTACT_REQUEST)).resolves.toMatchObject({
      errorClass: 'unavailable',
      status: 'failure',
    })
    expect(requestCount).toBe(1)
  })
})

interface CreateAdapterOptions {
  readonly request: NotionFetch
  readonly sleep?: (durationMs: number) => Promise<void>
  readonly token?: string
}

function createAdapter(options: CreateAdapterOptions) {
  return createNotionContactRequestsAdapter({
    dataSourceId: DATA_SOURCE_ID,
    request: options.request,
    requestId: () => REQUEST_ID,
    sleep: options.sleep,
    token: options.token ?? TOKEN,
  })
}

function createResponseError(
  status: number,
  retryAfter?: string,
): {
  readonly response: {
    readonly headers: Headers
    readonly status: number
  }
} {
  const headers = new Headers()

  if (retryAfter) {
    headers.set('retry-after', retryAfter)
  }

  return {
    response: {
      headers,
      status,
    },
  }
}

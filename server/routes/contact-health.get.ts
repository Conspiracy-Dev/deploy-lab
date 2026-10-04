import { setResponseHeader, setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const isConfigured = Boolean(config.notionToken.trim() && config.notionDataSourceId.trim())

  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseStatus(event, isConfigured ? 200 : 503)

  // Readiness checks configuration presence; only a live submission proves access.
  return { status: isConfigured ? 'ready' : 'unavailable' }
})

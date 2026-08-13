import type { NotionDeliveryFailure } from '../integrations/notion/contact-requests'

/** Writes the only permitted contact-delivery diagnostic fields to the Node process log. */
export function writeContactDeliveryFailureDiagnostic(failure: NotionDeliveryFailure): void {
  process.stderr.write(
    `${JSON.stringify({
      durationMs: failure.durationMs,
      errorClass: failure.errorClass,
      event: 'contact_delivery_failure',
      requestId: failure.requestId,
    })}\n`,
  )
}

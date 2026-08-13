# ADR: Contact-form delivery to Notion

- **Status:** Accepted — implementation pending
- **Date:** 2026-08-13
- **Decision owner:** Nikita Zinevich
- **Design source:** [Contact desktop / 48:1595](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=48-1595&p=f&m=dev), [Contact mobile / 144:1236](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=144-1236&p=f&m=dev), [success / 153:75](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=153-75&p=f&m=dev)

## Context

The homepage contact form is currently an intentionally visual-only client-side
composition. It collects name, email, message and Privacy Policy consent, but
has no submit handler, validation, server route or delivery integration. The
site was previously documented for static generation, which cannot execute a
server endpoint or protect a Notion credential.

The owner approved Notion as the sole delivery destination. Email notifications,
auto-replies, CRM workflow, CAPTCHA and analytics are not part of this change.
Production will run a single Nuxt/Nitro Node.js process behind a trusted
Nginx/Caddy reverse proxy.

## Decision

1. The client submits a same-origin JSON `POST /api/contact` request. A Nitro
   server route owns request validation and delivery; browser code never calls
   Notion or receives its credential.
2. The server validates trimmed input with Zod: Name is 2–100 characters,
   Email is a valid email of at most 200 characters, Message is 10–2000
   characters, and consent must be true. A hidden `website` honeypot is always
   empty for a genuine visitor.
3. The server creates a page in a new Notion database named
   `DeployLab — Contact requests`, under `Лендинг DeployLab`. Its minimal
   schema is `Name` (title), `Email` (email), `Message` (rich text), `Status`
   (status, default `New`) and `Submitted at` (created time).
4. The Notion adapter lives below `server/integrations/notion/` and uses the
   existing server fetch capability instead of adding an SDK for one create-page
   operation. It sends `Notion-Version: 2026-03-11`. The Notion integration has
   only the capability needed to insert content into the target data source.
5. `NUXT_NOTION_TOKEN` and `NUXT_NOTION_DATA_SOURCE_ID` are private runtime
   configuration. They are supplied only to the Node process and are never
   committed, exposed through public runtime config, logged or returned to the
   browser.
6. The API accepts JSON POST only, checks the canonical request Origin, limits
   the body to 8 KB, and allows five attempts per 15 minutes per client IP. The
   in-memory limit is intentionally scoped to one Node process. With
   `NUXT_TRUST_PROXY=true`, the application accepts the client address only from
   Nginx/Caddy-managed forwarded headers; the proxy must overwrite any incoming
   forwarded headers.
7. A filled honeypot returns a generic successful response without creating a
   Notion page. Notion errors are mapped to stable application responses; logs
   contain a request ID, duration and error class only — never submitted PII,
   client IP, credentials or a vendor response body. A Notion 429 receives one
   bounded retry respecting `Retry-After`; timeouts and 5xx responses are not
   retried to avoid duplicate applications.
8. The form uses native submit semantics, disables inputs while submitting,
   preserves entered values on error and replaces itself with the existing
   Figma-derived `UiSuccessNotice` after success. The approved new copy is
   `Sending…`, field-level prompts, and “We couldn’t send your request. Please
   try again.”
9. This decision supersedes the homepage ADR's visual-only form direction only
   when the implementation and tests described in the contact-form plan ship.
   Until then the existing visual-only UI remains the factual runtime behaviour.
10. No commit, push, deploy, Notion database creation or credential provisioning
    is authorised by this ADR alone. Each still requires the owner's explicit
    instruction at the relevant epic.

## Consequences

- Production moves from static-only output to a Node/Nitro deployment. The
  homepage may remain prerendered for performance and SEO, but its form needs a
  running server at submit time.
- The current visual-only Contact tests must be replaced with route, component
  and Playwright coverage for validation, loading, success, failure and retry.
- The in-memory rate limit does not coordinate multiple Node processes. A future
  horizontally scaled deployment needs a shared limiter before retaining the
  same abuse contract.
- A request that times out after Notion has accepted it can be manually retried
  and create a duplicate. The approved minimal Notion schema deliberately does
  not add an idempotency field; revisit this if duplicate handling becomes a
  real operating problem.

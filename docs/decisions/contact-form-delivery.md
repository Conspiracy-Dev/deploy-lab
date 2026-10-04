# ADR: Contact-form delivery to Notion

- **Status:** Accepted — Epics 0–3 implemented
- **Date:** 2026-08-13
- **Last amended:** 2026-10-04 — Epic 4 source implementation; live delivery pending
- **Decision owner:** Nikita Zinevich
- **Design source:** [Contact desktop / 48:1595](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=48-1595&p=f&m=dev), [Contact mobile / 144:1236](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=144-1236&p=f&m=dev), [success / 153:75](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=153-75&p=f&m=dev)

## Context

At the start of this task, the homepage contact form was an intentionally visual-only client-side
composition. It collects name, email, message and Privacy Policy consent, but
has no submit handler, validation, server route or delivery integration. The
site was previously documented for static generation, which cannot execute a
server endpoint or protect a Notion credential.

The owner approved Notion as the sole delivery destination. Email notifications,
auto-replies, CRM workflow, CAPTCHA and analytics are not part of this change.
The source now implements the form and API. Production delivery requires the
Epic 4 runtime profile described below and a separately reviewed live release.

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
   preserves entered values on error and shows text prompts beneath invalid
   fields with semantic associations. It announces delivery failure in a
   form-level `role="alert"`. After success it replaces itself with the existing
   Figma-derived `UiSuccessNotice`, plus the existing UI-kit button “Start a new
   request”; that button restores the form and is full-width at the 390 px
   endpoint. The approved new copy is `Sending…`, field-level prompts and “We
   couldn’t send your request. Please try again.”
9. This decision supersedes the homepage ADR's visual-only form direction only
   when the implementation and tests described in the contact-form plan ship.
   Until then the existing visual-only UI remains the factual runtime behaviour.
10. No commit, push, deploy, Notion database creation or credential provisioning
    is authorised by this ADR alone. Each still requires the owner's explicit
    instruction at the relevant epic.
11. The owner approved the public API outcome contract: a valid request and a
    filled honeypot return `201 { status: 'accepted' }`; invalid fields return
    `400 invalid_request` with only field names; invalid origin, oversized
    body, unsupported media type, client rate limiting and delivery failure
    return `403`, `413`, `415`, `429` and `503` respectively. The route never
    exposes a Notion status, request ID, IP address, credential or request data.

## Runtime amendment — 2026-10-04

The owner approved keeping Caddy's static page delivery and adding one internal
Node/Nitro service on the existing VPS. Caddy proxies only the exact
`/api/contact` path, preserving its prefix; static rewrites stay in the other
handler. Caddy overwrites `X-Forwarded-For` with the direct peer address before
Nitro uses it. The API has no published host port and runs as the `node` user.
The default runtime log removes Caddy's request object so proxy errors do not
persist client IPs, request URLs or headers. Access logging remains disabled.

One release image contains Caddy, prerendered pages and the Nitro output. Its
default command runs Caddy; the `api` Compose service overrides the command to
`node /app/.output/server/index.mjs`. Both services use the same immutable
digest, retaining the existing GHCR publication and approval workflow. This
costs some image space but avoids another registry package, separate release
identifiers or a process supervisor. No runtime dependency is added.

`pnpm build` retains the server while prerendering the public pages and SEO
routes. `/contact-health` is an internal readiness route: it returns only a
status, does not call Notion and checks configuration presence, not credential
validity. Caddy does not proxy it. Missing configuration keeps the API
unhealthy; the static pages remain available when the API is unavailable.

Production credentials belong in root-owned mode-0600
`/opt/deploy-lab/contact.env`, read by Docker Compose only for `api`; they are
neither build arguments nor Caddy environment. The owner must provision the
Notion integration and explicitly share the target database with it.

The initial transition needs owner maintenance with backups of the static
Compose, Caddy, wrapper and image-state files. Routine digest-only releases
reject a static current/candidate image through the `contact-v1` runtime label.
After the first hybrid release is accepted, updates and rollback use one
compatible digest for both services and wait for both health checks. A return
to the old static release restores its complete configuration bundle; merely
replacing the digest is not a valid downgrade.

Implementation and local acceptance do not establish production acceptance.
The Notion token is not yet provisioned as of this amendment; the release and
one approved live request remain open in the roadmap.

## Consequences

- The release gains a Node/Nitro service for form delivery; pages remain
  prerendered and served by Caddy for performance and SEO.
- The current visual-only Contact tests must be replaced with route, component
  and Playwright coverage for validation, loading, success, failure and retry.
- The in-memory rate limit does not coordinate multiple Node processes. A future
  horizontally scaled deployment needs a shared limiter before retaining the
  same abuse contract.
- A request that times out after Notion has accepted it can be manually retried
  and create a duplicate. The approved minimal Notion schema deliberately does
  not add an idempotency field; revisit this if duplicate handling becomes a
  real operating problem.

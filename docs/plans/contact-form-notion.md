# Contact form → Notion implementation plan

Status: Epics 0–2 complete; Epics 3–4 pending

Last updated: 2026-08-13

## Goal

Turn the homepage Contact section into an accessible, protected form that
creates a single request in Notion. Keep the existing Figma desktop/mobile
layout and use the supplied success design after a successful submission.

## Non-goals

- Send owner notifications or an automatic email response.
- Add a CRM, queue, CAPTCHA, analytics, Sentry, Redis/KV or Notion SDK.
- Change or write to Figma.
- Commit, push or deploy without separate owner review and approval.
- Store IP addresses, user agents or other browser telemetry in Notion or logs.

## Constraints

- Production is a single Nuxt/Nitro Node.js process behind Nginx/Caddy; static
  `nuxt generate` output alone cannot serve the API.
- Notion is the only delivery destination. The target database will be created
  under `Лендинг DeployLab` during Epic 1.
- The current form is visual-only. Documentation must not describe a functional
  API until its implementation and verification are complete.
- Use existing Nuxt, Vue, Zod, `$fetch`, `nuxt-security` and UI primitives. No
  new runtime package is justified for this scope.
- Form inputs are Name 2–100, Email valid and ≤200, Message 10–2000 and
  mandatory Privacy Policy consent. Trim whitespace before validation.
- Abuse baseline: honeypot, same-origin JSON POST, 8 KB request limit and five
  submissions per 15 minutes per proxied client IP in one process.

## Ownership seam

- `HomeContact` owns rendered controls and user-visible submit states.
- A shared runtime-neutral contract owns the request/response schema and
  client-safe error codes.
- `server/api/contact.post.ts` owns HTTP validation, abuse controls and mapping
  results to the public API.
- `server/integrations/notion/` owns the volatile Notion protocol and property
  mapping. It does not import from `app/`.

## Plan

### Epic 0 — branch, accepted decisions and delivery plan

Status: Complete

1. Create `codex/contact-form-notion` from current `origin/main` and preserve a
   clean worktree.
2. Record accepted product, security, hosting and Notion decisions in one ADR.
3. Maintain this plan as the single execution roadmap and link it from the docs
   index.
4. Verify the documentation structure with the repository intake check and the
   normal static documentation gate.

Acceptance: the task has an isolated branch, one ADR, one roadmap and no
production code or external data changes.

Delivery evidence — 2026-08-13: branch `codex/contact-form-notion` was created
from `origin/main`; the accepted ADR and this roadmap are linked from the docs
index. On Node 24.16.0/pnpm 11.5.2, intake, scoped formatting, typecheck, lint
(15 pre-existing warnings), Stylelint, Slop Scan, 42 Vitest tests, dependency
and cycle checks, production build and the full Playwright desktop/mobile
baseline passed. Chromium was installed locally with owner approval. Four
viewport-specific Playwright scenarios were intentionally skipped; existing
Nuxt hints report hydration and LCP diagnostics outside this documentation-only
epic. Static generation and link inspection passed. Lighthouse recorded
homepage scores of 0.99 performance, 0.96 accessibility, 1.00 best practices
and 1.00 SEO; Privacy Policy recorded 0.98, 1.00, 1.00 and 1.00. Gitleaks found
no secrets. No production code, secret or external Notion data changed.

### Epic 1 — Notion destination and server adapter

Status: Complete

1. Create `DeployLab — Contact requests` as a child of `Лендинг DeployLab` with
   only `Name`, `Email`, `Message`, `Status` and `Submitted at`; verify the
   returned data source schema read-only. Keep its identifier out of Git.
2. Define private Nuxt runtime configuration and `.env.example` placeholders
   for the Notion token and data source ID. Do not place a value in either file;
   owner provisioning of an Insert Content-only Notion integration remains an
   external deployment step.
3. Implement `server/integrations/notion/` as one typed create-page adapter
   using direct server `$fetch`, the pinned Notion API version and a finite
   timeout. The adapter input remains server-local until Epic 2 owns the public
   request contract.
4. Return typed integration outcomes rather than vendor errors. Log only a
   generated request ID, duration and error class. Retry a Notion 429 once from
   the adapter after its `Retry-After` value; do not retry timeouts or 5xx.
5. Add isolated adapter tests with mocked fetch for exact property mapping,
   malformed configuration, 401/403, 429 retry, timeout and 5xx. No test calls
   the live Notion API or creates a test request row.

Stop condition: stop before closing Epic 1 if the database schema differs from
the approved five properties, the integration cannot be granted Insert Content
access, or a credential would be exposed to the browser or repository.

Acceptance: the adapter has no browser dependency, no secrets in source and a
successful mocked request maps to the five approved Notion properties.

Progress — 2026-08-13: the target Notion database was created under the
approved parent and its schema was read back without placing its identifier in
Git. Its only properties are `Name`, `Email`, `Message`, `Status` and
`Submitted at`; `Status` has `New` as its initial option. Private runtime
placeholders and a mocked, server-only adapter are implemented and verified.
Live credentials and a live row are deliberately deferred to Epic 4.

Delivery evidence — 2026-08-13: the adapter sends the approved create-page
payload with the pinned API version and returns safe typed outcomes. Eight
mocked tests cover property mapping, configuration, invalid input, 401/403,
one `Retry-After` retry for 429, timeout and 5xx behavior; no request reaches
the live Notion API. The full Node 24.16.0/pnpm 11.5.2 verification gate passed
after the schema confirmation; its commands and results are recorded in the
implementation handover for this epic.

### Epic 2 — public endpoint and abuse boundary

Status: Complete

### Execution plan

1. Confirm the small public response contract before writing route code. The
   proposed client-safe outcomes are: `201 { status: 'accepted' }` for a real
   request and for a filled honeypot; `400 invalid_request` with only invalid
   field names; `403 invalid_origin`; `413 payload_too_large`; `415
unsupported_media_type`; `429 rate_limited` with `Retry-After`; and `503
service_unavailable` for every Notion/configuration failure. No response
   contains a request ID, vendor message, credential, IP or submitted value.
2. Add one runtime-neutral Zod contract under `shared/` for the exact JSON
   object (`name`, `email`, `message`, `consent`, `website`) and the client-safe
   outcomes. It trims Name, Email and Message before applying the approved
   limits, requires `consent: true`, forbids unknown shapes, and keeps the
   adapter input as a narrowed server-only projection.
3. Add `server/api/contact.post.ts` as the sole HTTP orchestration point. It
   accepts only `application/json`, compares `Origin` to the configured
   canonical public origin, measures the actual raw body as well as declaring
   an 8 KB limit, parses JSON once and validates it before creating the Notion
   adapter from private runtime config. A filled `website` honeypot receives
   the same accepted response and never calls Notion.
4. Configure a narrow `routeRules['/api/contact']` policy with the existing
   `nuxt-security` request-size and allowed-method middleware. Do not use its
   rate limiter for this route: the installed version unconditionally consults
   `X-Forwarded-For` and cannot enforce the approved trust boundary.
5. Add a small server-only, in-memory five-attempts/15-minute limiter and
   client-address resolver. A new private `NUXT_TRUST_PROXY` setting is false
   by default; only literal `true` permits the leftmost `X-Forwarded-For` value
   supplied by Nginx/Caddy. Otherwise use the socket address. The deployment
   checklist must require the proxy to overwrite forwarded headers. Neither IP
   nor raw request data is persisted or logged.
6. Map every adapter failure to the approved generic unavailable outcome, then
   emit only JSON-safe diagnostics — request ID, duration and error class — to
   the Node process log without `console` (production strips console logging).
   A Notion-side rate limit remains a delivery failure, not a client-IP 429.
7. Test at the HTTP seam with the Notion adapter mocked: accepted request and
   exact adapter input; whitespace and every invalid field; malformed JSON;
   wrong method, origin and content type; declared and chunked oversize bodies;
   honeypot; proxied and direct client-IP selection; sixth request; and all
   adapter failure classes. No route test uses a credential or calls Notion.
8. Run the full server-epic gate on Node 24.16.0/pnpm 11.5.2: intake,
   formatting, typecheck, lint, Stylelint, Slop Scan, focused and full Vitest,
   dependency/dead-code checks, Node/Nitro build, generate/link inspection,
   Gitleaks and diff/status checks. Smoke-test the built Node server with a
   mocked adapter/configuration only; live Notion creation stays in Epic 4.

Stop condition: stop before implementation if the response contract is not
approved, the canonical public origin is unavailable at runtime, the reverse
proxy cannot overwrite forwarded headers, or a route test would require a live
credential or Notion request.

Acceptance: only a valid, allowed request reaches the Notion adapter; client
responses contain no vendor detail or sensitive data.

Delivery evidence — 2026-08-13: the owner approved the public response
contract. `POST /api/contact` now validates the strict shared JSON contract,
checks the configured canonical Origin, limits actual and declared bodies to
8 KB, hides successful honeypots, limits one Node process to five attempts per
15 minutes and returns only client-safe outcomes. `NUXT_TRUST_PROXY` defaults
to false and permits forwarded client addresses only when explicitly true; the
deployment must make Nginx/Caddy overwrite forwarded headers. The route uses
the existing route-level request-size and method middleware, while its rate
limit stays local because the installed middleware cannot enforce that proxy
trust boundary. `h3@1.15.11`, already used by Nuxt/Nitro, is declared directly
so the server utility import is an explicit, lockfile-pinned contract rather
than an implicit transitive dependency. Unit tests cover the public schema, fields and response shapes,
direct/proxied address selection and rate-limit timing; existing adapter tests
cover Notion I/O. A built Node server smoke produced honeypot `201`, missing
configuration `503`, unsupported media `415`, invalid Origin `403`, wrong
method `405`, five permitted requests then `429`, and oversized `413`, without
a live Notion request or exposed secret.

### Epic 3 — Contact UI and accessibility

Status: Pending

1. Replace visual-only button behaviour with a native form submit path.
2. Add `idle`, `submitting`, `success` and `error` states using existing UI
   primitives and Figma success composition.
3. Add inline field errors, accessible error associations, first-invalid focus,
   disabled controls while sending and retry without losing entered values.
4. Correct the consent/link markup without changing the approved visual layout.
5. Replace visual-only form tests with component and Playwright user-path tests
   using a mocked `/api/contact` boundary.

Acceptance: keyboard submit, validation, loading, duplicate-submit protection,
success and retry work at 1440 px and 390 px without overflow.

### Epic 4 — deployment readiness and owner review

Status: Pending

1. Update current-behaviour documentation only after functional code exists:
   runtime deployment command, form capability and environment-variable setup.
2. Run one owner-approved live smoke that creates a clearly identified test row
   in the target Notion database.
3. Run the full verification chain and hand over browser evidence and the diff
   for review. Do not stage, commit, push or deploy.

Acceptance: code, docs and live configuration agree; tests are green and the
owner can review the exact change before delivery.

## Verification

After every epic, run the smallest focused checks first, then the appropriate
full gate on Node 24 and pnpm 11:

- `pnpm task:intake:check --file docs/plans/contact-form-notion.md` for plan
  changes;
- `pnpm format:check`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:styles`,
  `pnpm slop-scan` and focused Vitest tests;
- route/adapter tests for server epics; Playwright plus desktop/mobile browser
  evidence for UI epics;
- `pnpm build` for every server/API change; `pnpm generate` and Lighthouse as
  homepage regression evidence; and
- `pnpm secrets:check`, `git diff --check` and `git status --short` before an
  epic is marked complete.

## Risk and stop condition

Stop the affected epic and request owner input when the Notion integration does
not have access to the approved database, production cannot run the Node/Nitro
server behind the agreed trusted proxy, a secret must be placed in source/public
config, or an unapproved UI/design decision is required. Do not replace those
conditions with a client-side Notion call, a static-hosting workaround or a
silent fallback.

Plain-language summary: visitors will be able to send a project request from
the existing Contact section. Their name, email and message will arrive in one
private Notion list; no automatic email will be sent. The site will reject
obvious automated abuse and will clearly show whether a request was sent or
needs another attempt.

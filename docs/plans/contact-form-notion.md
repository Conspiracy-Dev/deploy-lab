# Contact form → Notion implementation plan

Status: Epics 0–4 complete; reviewed hybrid runtime and live Notion delivery accepted

Last updated: 2026-10-13

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

- Current production at `https://noash.net` runs the reviewed Caddy + Nitro
  profile after the 2026-10-12 migration. Both services are healthy and use
  one immutable image. The failed first rollout and restoration remain
  historical evidence, not the current runtime state.
- Functional delivery requires an explicitly approved Nuxt/Nitro Node.js
  runtime behind a trusted proxy; static `nuxt generate` output alone cannot
  serve the API.
- Notion is the only delivery destination. Epic 1 created the target database
  under `Лендинг DeployLab`; its five-property schema was reconfirmed read-only
  during Epic 4.
- This branch contains the implemented and tested form. One real delivery
  succeeded during the first hybrid rollout. On 2026-10-12 the owner authorized
  exactly one additional live request; it verified current end-to-end delivery
  and the corrected success/reset UI. Both marked test rows are retained.
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

Status: Complete

#### Design evidence and decision required

- The approved resting form is Contact desktop `48:1595` and mobile
  `144:1236`. It has no error or loading variant.
- The approved success composition is desktop node `153:75`, already rendered
  by `UiSuccessNotice`; no separate mobile success node exists.
- Therefore implementation must not silently invent a red invalid state,
  spinner, reset CTA or a new shared form component.

Before code, the owner must approve this minimal treatment for the states
absent from Figma:

1. Show a short text prompt beneath each invalid field and set
   `aria-invalid`/`aria-describedby`; do not rely on colour alone. Proposed
   prompts are: “Enter your name using 2–100 characters.”, “Enter a valid email
   address.”, “Enter a message using 10–2,000 characters.” and “Accept the
   Privacy Policy to continue.”
2. Show the ADR-approved generic request failure copy in a form-level
   `role="alert"`, retaining every entered value and offering the existing
   `Send request` button again.
3. Replace the form with the existing `UiSuccessNotice` after `201 accepted`,
   using the exact Figma success copy and its existing responsive, column
   layout at 390 px as well as 1440 px. Add the existing UI-kit button “Start a
   new request”; it restores the cleared form and is full-width at 390 px.

#### Execution plan

1. **E3.1 — Preserve the contract at the UI boundary**
   - Keep state local to `HomeContact.vue`; a composable, store and new package
     have no second consumer and are out of scope.
   - Reuse `contactRequestSchema` and the shared response schemas from
     `shared/contracts/contact-request.ts` so browser feedback uses the same
     trim, length and consent rules as `/api/contact`.
   - Add a typed local state machine: `idle`, `submitting`, `success` and
     `error`. It makes the submit handler single-flight and prevents a second
     request while the first is pending.

2. **E3.2 — Implement native, accessible submission**
   - Change the CTA to `type="submit"` and bind `@submit.prevent` to the
     `<form>` so click and Enter use the same path; retain `novalidate` because
     the shared contract supplies consistent custom feedback.
   - Submit the exact approved JSON shape — including an accessibility-hidden,
     keyboard-inaccessible `website` honeypot — with same-origin `$fetch` to
     `/api/contact`. Do not call Notion from the browser or add client-only
     rendering.
   - Validate locally before I/O. Map a `400 invalid_request` response by field
     name; map every other approved non-success response and network failure to
     the generic failure notice, without rendering vendor or transport detail.
   - During `submitting`, disable all fields, consent and submit button, expose
     `aria-busy`, and replace the button label with the ADR-approved
     “Sending…”. On failure restore interactivity and preserve values; on
     success clear local values, show `UiSuccessNotice` and offer the approved
     existing-UI-kit “Start a new request” button.

3. **E3.3 — Repair semantic relationships without changing resting layout**
   - Associate each existing visually hidden label, input and inline error by
     stable IDs. Put focus on the first invalid control after a failed submit;
     announce generic delivery failure with `role="alert"` and retain
     `UiSuccessNotice`’s `role="status"`.
   - Split the consent text, checkbox label and Privacy Policy link so the
     anchor is no longer nested inside `<label>`. Keep one named native checkbox
     and its current focus treatment.
   - Add only token-based, mobile-first error spacing and text styling after
     the owner decision; do not alter the owner-accepted resting consent/link
     contrast debt or introduce animation.

4. **E3.4 — Replace obsolete visual-only proof**
   - Update the Nuxt component test in `test/nuxt/home-epic-four.test.ts` from
     the obsolete `button[type="button"]` contract to observable form
     semantics, field associations, loading disablement, invalid focus,
     success status and retry/value retention. Mock only the `$fetch` boundary.
   - Replace the visual-only Contact Playwright scenario in
     `test/e2e/home.spec.ts` with route-intercepted `/api/contact` user paths:
     keyboard Enter success, client validation with no request, one in-flight
     request despite repeated submit, server failure and retry, and success
     status. No test contacts Notion.
   - Run the Contact paths at 390 px and 1440 px; retain the existing 320/768
     document-overflow proof and add no snapshot baseline unless a deterministic
     visual mismatch needs review.

5. **E3.5 — Epic gate and documentation state**
   - First run focused Nuxt and Playwright tests, then typecheck, lint,
     Stylelint, static quality, build, generate/link inspection, secrets and
     diff checks on Node 24/pnpm 11.
   - Inspect the real browser at 390 px and 1440 px in resting, invalid,
     submitting, failure and success states; record the result in this roadmap.
   - Update the ADR and this plan only with delivered behaviour and test
     evidence. Do not stage, commit, push or begin Epic 4 without a separate
     owner instruction.

Acceptance: keyboard submit, validation, loading, duplicate-submit protection,
success and retry work at 1440 px and 390 px without overflow. The browser
submits no secret and the test suite performs no live Notion write.

Delivery evidence — 2026-08-13: `HomeContact` now uses native form submit
semantics and the shared contact contract for client validation. Inline prompts
are associated with invalid fields and focus follows the visual field order;
delivery failures keep values and announce a generic retryable error. The form
disables during one pending request, then shows the existing `UiSuccessNotice`.
The approved existing UI-kit “Start a new request” button restores the cleared
form and takes the full available width at the 390 px endpoint. Contact Nuxt
tests mock only `$fetch`; Playwright intercepts `/api/contact`, so verification
does not write to Notion. Node 24.19.0/pnpm 11.19.0 checks passed: formatting,
typecheck, ESLint (15 pre-existing warnings; no errors), Stylelint, Slop Scan,
64 Vitest tests, dependency/cycle checks, 34 desktop/mobile Playwright tests
with the existing intentional skips, production build, static generation/link
inspection, secret scan and diff check. Browser proof covered normal, invalid,
pending, failure, retry and success states; the existing Nuxt hydration/LCP
hints remain unrelated baseline diagnostics.

### Epic 4 — deployment readiness and owner review

Status: Complete — reviewed runtime, additional authorized live request and compatible baseline verified

#### Confirmed delivery constraint

The pre-migration `origin/main` confirmed that production was live at
`https://noash.net` as one static Caddy container. Its Dockerfile runs `nuxt
generate` and copies only `.output/public`; the production Compose and Caddy
configuration have no Node service or private runtime environment. The accepted
contact-form ADR instead requires a running Nuxt/Nitro Node.js process behind a
trusted proxy. A static release cannot serve `POST /api/contact` or keep the
Notion token private. The owner resolved that conflict on 2026-10-04 by
approving static Caddy page delivery plus one internal Nitro process for
`/api/contact`. This branch owns the scoped Docker, Compose, Caddy, smoke,
wrapper and documentation changes. Both services use one immutable image
digest; existing publication and protected production approval remain in place.

#### Execution plan

1. **E4.1 — Confirm the production and release contract**
   - [x] Approve static Caddy + internal Nitro and preserve `https://noash.net`
         as the canonical public origin.
   - [x] Amend the contact and VPS ADRs in this worktree, retaining the
         historical static release records.
   - [x] Prepare Caddy to overwrite `X-Forwarded-For` with its direct peer
         address; Nitro has no published host port. Verify forged-header rate
         limiting before accepting `NUXT_TRUST_PROXY=true` in this topology.
   - `origin` remains `git@github.com:Conspiracy-Dev/deploy-lab.git`. The owner
     approved HTTPS transport through the existing authenticated CLI account
     for publication; global Git/SSH settings and token scopes are unchanged.

2. **E4.2 — Prepare the approved private runtime configuration**
   - [x] Provision `NUXT_NOTION_TOKEN` and `NUXT_NOTION_DATA_SOURCE_ID` only in
         root-owned mode-0600 `/opt/deploy-lab/contact.env`. A read-only check
         confirms file safety and entry format; values remain private.
   - [x] Prepare Compose to read the private file for `api` only and preserve
         the canonical public URL. Live runtime isolation passed during the
         first and repeated migrations.
   - [x] Confirm the Notion integration has access only to the target contact
         data source and can insert content. Do not print, commit, paste into
         a browser, or add any secret to `.env.example`.
   - [x] Implement one image with Caddy, Node and Nuxt server/public output;
         build it with `pnpm build` and explicit page prerendering.
   - [x] Prepare Compose, exact-path Caddy routing, internal readiness,
         configuration isolation and compatible-release checks. Add container
         and browser smoke evidence before the first migration.
   - [x] After code review, perform the first owner-maintenance migration with
         a complete static configuration/state backup; verify runtime isolation.
   - [x] Review and merge the UI correction; verify main quality and candidate evidence.
   - [x] Complete the corrected protected release and repeat the configuration
         migration; record the actual GitHub gate outcome without claiming an
         approval that did not occur.
   - [x] Establish an accepted hybrid baseline after final acceptance, before
         routine digest-only rollback.

3. **E4.3 — Run one owner-approved, production live smoke**
   - [x] Agree the exact clearly marked test Name, Email, Message and retention.
         The owner's email stays outside Git. Send only after the reviewed
         production migration; do not delete the resulting entry automatically.
   - [x] Submit once through the real Contact UI at the canonical origin. Verify
         one `201 { status: 'accepted' }` response and exactly one Notion page
         with the approved Name, Email, Message, Status `New` and Submitted at.
   - [x] Verify corrected success-only UI at 390 and 1440 px on production with
         an intercepted response, including cleared-form reset and no overflow.
   - [x] Obtain owner acceptance of prior live delivery plus current controlled
         UI proof, or obtain explicit authorization for one additional live
         request and verify it. The original single-submit authorization is
         exhausted; a default-selected option is not authorization.
   - Inspect application/proxy diagnostics only for safe request ID, duration
     and error class. Stop if submitted text, email, token, IP, Notion response
     body or forwarded-header spoofing appears in logs or browser output.

4. **E4.4 — Align current-behaviour documentation after the live proof**
   - [x] Update README, contact/VPS ADRs and runbook to distinguish source
         behavior from the last accepted static production release. Document
         private configuration and first-migration rollback.
   - [x] Record the tested revision, actual delivery, UI defect and restoration;
         distinguish delivery proof from final production acceptance.
   - [x] Record the corrected deployed revision, digest and runtime evidence.
   - [x] Record final acceptance and the compatible baseline after the owner's decision.
   - Preserve the historical Figma/homepage delivery record rather than
     rewriting it as if it had always included form delivery. Link readers to
     this ADR and roadmap for the superseding behaviour.
   - Update the VPS ADR/roadmap only in the deployment workstream approved in
     E4.1. Record actual commands, owner-managed secret locations and deployed
     revision without recording secret values.

5. **E4.5 — Final regression gate and owner handover**
   - [x] On Node 24/pnpm 11, run intake and formatting checks,
         `pnpm quality:static`, dependency/dead-code checks, `pnpm build`, Playwright,
         `pnpm generate` and Lighthouse as homepage regression evidence,
         `pnpm secrets:check`, `git diff --check`, and `git status --short`.
   - [x] Add a production-server smoke, private-runtime isolation and real
         browser proof from the first rollout; static generation alone cannot verify the API.
   - [x] Re-run the corrected browser state after the reviewed release without
         silently adding a second live request or pointing CI at Notion.
   - [x] Final owner handover and Epic 4 closure; the next epic stays out of scope.
   - [x] Prepare the scoped diff, checks and remaining live tasks for handover. The owner
         authorized a local Epic 4 commit; publication remains subject to code
         review and the existing production approval. Do not proceed to another epic.

Progress — 2026-10-04: Docker and Compose are available. Notion MCP confirmed
the expected five-property target schema read-only. The owner confirmed that
the production token is not yet provisioned and requested a test email without
specifying its address or retention policy. Local verification uses synthetic
configuration on an isolated Docker network and never creates a Notion page.

Source delivery evidence — 2026-10-04: on Node 24.16.0/pnpm 11.5.2, the
quality gate passed with all 64 Vitest tests and the existing 15 ESLint
warnings. Dependency/cycle and dead-code checks passed; intake, full
formatting, secret scan and diff checks passed. `pnpm build` retained Nitro;
`pnpm generate` passed link inspection with no errors or warnings. The full
Playwright suite passed 29 scenarios with 5 existing intentional skips; dev
hydration/LCP hints remain baseline diagnostics. Lighthouse's current median
homepage scores are performance 1.00, accessibility 0.96, best practices 0.96
and SEO 1.00; Privacy Policy scores are 0.98/1.00/1.00/1.00. The homepage's
DevTools CSP issue accounts for its non-perfect best-practices score; the
existing assertion thresholds pass.

Both linux/arm64 and linux/amd64 Docker builds passed. Image smokes verified
pages, SEO, static assets/cache headers, 404, HTTPS healthcheck behavior,
internal readiness, public-only contact routing, JSON/Origin rejection,
honeypot acceptance, spoof-resistant rate limiting and safe missing-config
failure, plus rejection of bodies over 8 KB. With Nitro stopped, pages stayed
available. The built-image browser
smoke at 390/1440 px proved field validation, real API 503/value retention,
HTTP-mocked success and the reset action without overflow. Caddy/API log
checks found no test email, message, forwarded address or synthetic token.
The full Compose build/start/restart smoke passed with both services healthy.
Production Compose isolation and the production Caddy configuration validated.
Wrapper, status, candidate/release policy and public-smoke tests passed;
`actionlint` passed. These are local acceptance results, not a live Notion
delivery or a production migration.

Read-only public verification on 2026-10-04 returned HTTP 200 for the homepage
and HTTP 404 for `GET /api/contact`, consistent with the still-static live
release. No production POST, VPS mutation, image publication or push occurred.

Remaining Epic 4 implementation work: none. Final live delivery and the
compatible hybrid baseline are verified. The closure documentation is handed
over in the owner-authorized local commit; publication of this new documentation
branch remains a separate approval boundary. No next epic is authorized.

Provisioning support — 2026-10-04: owner-requested workstation helpers now
provide SSH connection, editor-based private configuration and value-redacted
file checks through the existing maintenance identity and pinned host key.
The alias/key stay outside Git. These helpers do not release or restart the
site and have not been run against production; E4.2 provisioning and live
Notion acceptance remain open.

Helper verification — 2026-10-04: ShellCheck and Bash syntax checks passed.
Mocked SSH tests proved pinned host-key options, production-host/account
restrictions and exact remote-program quoting. An isolated, network-disabled
Docker test proved file creation, preservation of existing values, rejection of
unsafe permissions, symlinks/hard links, missing/duplicate/malformed entries
and non-execution of configuration text, without secret output. Formatting,
the static quality gate (64 tests; 15 existing ESLint warnings), secret scan,
task-intake and diff checks passed. No VPS command or Notion request ran.

Production preflight — 2026-10-04: after the owner's provisioning, the
value-redacted read-only check confirmed the private file is root-owned,
mode 0600, without symlink/hard-link redirection, and has both valid-format
entries. The owner confirmed access is limited to the contact database; actual
Notion authorization remains unproven until the site's own live request.
The current static container is healthy, public page smoke passes and
`GET /api/contact` returns 404. The installed read-only status command reports
current digest `653f0283674afa6e840ddecd712b6b13b7e61c8e89ba8f8a326022e6135a0bfb`
and previous digest `7212bd3f7bcd15e9983b348f62fa6bc0ad1aee60a11b869de2d55dbc64de15f7`.
GitHub main remains
`3ec752039f1d05b2ac01cb266bfcdd0135cb6bed`; no contact-form PR exists yet.
The owner authorized branch publication and a PR for review, not merge or
production release. The latest manual release's deploy job succeeded but its
public-smoke job failed; the current independent public smoke passes. No
workflow was rerun. Default Git SSH authentication currently fails; publication
requires verified access or owner-approved HTTPS through the existing GitHub
CLI identity. The CLI lacks `admin:public_key`, so it cannot verify private
account key-management metadata; no scope expansion or SSH configuration
change was made. Test Name `DeployLab Epic 4 smoke`, Message
`Тест контактной формы, Epic 4` and retention are approved, but the exact test
email has not been supplied. No live POST or production mutation occurred.

Owner clarification — 2026-10-04: the exact test email was supplied privately;
all live-test values and retention are now agreed. The owner approved temporary
HTTPS Git transport using the existing authenticated CLI account `f7one`,
without changing `origin`, global Git/SSH configuration or token scopes.
Branch publication and PR creation are authorized; merge, first production
migration and the live submission remain subject to review/release approval.
The current static source revision matches remote main, so no rebase is needed.
The repeated helper and static quality gates passed; no next epic was started.

Review handoff — 2026-10-04: commit `317cc09` adds the checked configuration
helpers and current provisioning evidence. The owner-approved HTTPS transport
published `codex/contact-form-notion`; commit/push hooks passed without bypass.
[PR #23](https://github.com/Conspiracy-Dev/deploy-lab/pull/23) is open against
`main` for contact-form source review. The local origin URL and global SSH/Git
configuration are unchanged. Merge, workflow dispatch, production migration,
live Notion submission and the next epic were not performed. Continue only
after review and explicit release approval; retain the static backup bundle
before the first hybrid migration.

Production acceptance attempt — 2026-10-04: PR #23 was merged at
`adeaa7d84627d4229aff9ed45454f26d31589b8e`. Post-merge quality run
`37226408239`, candidate run `37226928511` and protected release run
`37226980101` passed; the existing production reviewer approved the release.
The verified digest was
`sha256:f0de97abae48350ffbcacf5a7e04c10570128c85f0287590917479ccae9d094c`.
Through owner maintenance, the reviewed Compose, Caddyfile and wrapper were
installed after creating `/var/backups/deploy-lab/contact-runtime.EMilP6`.
Both services became healthy. Public pages/TLS/SEO/assets/404 smoke passed,
internal readiness returned 200 and public `GET /api/contact` returned 405.
Runtime checks confirmed one shared image, an unprivileged read-only API with
no published port, private configuration only in API, the canonical origin,
proxy-trust setting and preserved Caddy volumes. Logs contained none of the
private values or agreed submitted values.

The owner-approved isolated browser sent exactly one real request, receiving
`201 { status: 'accepted' }`. Read-only Notion verification found exactly one
matching row with the privately agreed email, Status `New` and Submitted at.
The row is retained. At 390 and 1440 px success was visible with no document
overflow and no browser page errors, but the empty form remained underneath:
`HomeContact` lacked `v-else` on the form. This violates the accepted
success-only composition. Full UI acceptance therefore failed.

Following the first-migration runbook, the complete static configuration/state
bundle was restored and only the introduced API container was removed. The
site container is healthy; `GET /api/contact` again returns 404. The private
file, persistent Caddy volumes and Notion row were retained. There is no
accepted hybrid baseline yet. This is not a completed production rollout.

Correction roadmap: `codex/contact-form-epic4-acceptance` restores the
success/form mutual exclusion and adds assertions in component, E2E and
built-image browser tests. No new package, architecture or design decision is
needed. Review/publication and another protected release remain the next
approval boundary; no second production POST has been made.

Correction verification — 2026-10-04: `pnpm format:check`, roadmap intake,
`pnpm quality:static` (64 tests; 15 existing ESLint warnings), dependency and
dead-code checks, `pnpm build`, `pnpm generate` with clean link inspection,
`pnpm lighthouse`, `pnpm secrets:check` and `git diff --check` passed. The
cycle checker reported no cycles with its existing 28 skipped alias imports.
The first parallel `pnpm test:e2e` run had one `networkidle` navigation timeout
in the unrelated Projects/Process scenario. The complete repeat with
`pnpm test:e2e --workers=1` passed 29 scenarios with 5 intentional skips.
Existing development hydration/LCP hints remain visible.

`CONTACT_SMOKE_BROWSER=1 pnpm test:docker:smoke` rebuilt and verified the
corrected local image: pages, API policy, proxy trust, limits, safe failures,
readiness and restart recovery passed. Mocked browser success at 390/1440 px
now excludes the form and resets correctly. Separate screenshots of the
generated local page confirmed the same state, no horizontal overflow and no
page errors; these are UI proofs, not additional live Notion submissions.
Deployment-wrapper tests passed. Lighthouse median scores were homepage
1.00/0.96/0.96/1.00 and Privacy Policy 0.98/1.00/1.00/1.00; all assertions passed.
After restoration, the independent public production smoke passed again.
The correction handoff includes the owner-authorized local commit; publication
of this new branch requires the owner's answer. Epic 4 remains open pending
corrected rollout.

Repeat rollout preflight — 2026-10-12: the owner authorized the production
release and configuration migration, without authorizing another live request
or the next epic. PR #24 is merged at
`abbd8507d7d2747218de287b2588c15fe11d0c75`; main quality run `38196476053` and
candidate verification `38196907533` succeeded. Protected release run
`38197001717` has successful preparation but its deploy job is still waiting.
The `production` environment requires `iShavlovsky`, prevents self-review and
reports `current_user_can_approve=false` for the authenticated `f7one` account.
Do not use an administrator bypass, a second identity or direct VPS release to
replace this approval. The required reviewer must approve the existing run.

Read-only VPS preflight confirms the site container is healthy and the API
container is absent. The current digest remains the prior tested image
`sha256:f0de97abae48350ffbcacf5a7e04c10570128c85f0287590917479ccae9d094c`.
No production state, environment protections, private configuration or Notion
row was changed during this preflight. After approval and successful release,
continue E4.2 migration/health/isolation checks, E4.3 corrected browser
acceptance, E4.4 deployed-revision documentation and E4.5 final regression.
Another live POST still needs separate owner authorization.

Release retry — 2026-10-12: the owner reported accidental cancellation of run
`38197001717` and explicitly requested a retry. Attempt 1 completed with
successful preparation and cancelled deploy/public-smoke jobs. The unchanged
revision `abbd8507d7d2747218de287b2588c15fe11d0c75` is still main. The same
workflow was rerun as attempt 2 through the authenticated `f7one` account;
the required production environment approval is preserved. This retry is not
evidence of deployment or migration completion. No new live request was made.

Repeated migration evidence — 2026-10-12: protected release run `38197001717`,
attempt 2, completed successfully for main
`abbd8507d7d2747218de287b2588c15fe11d0c75`. Main quality `38196476053` and
candidate verification `38196907533` succeeded. The verified and deployed image
is `sha256:f60c18c8e99a2b4946b9a51757f82799939f999361a96ba9c903513e8d70f99d`.
The GitHub approvals API records environment `production`, state `skipped`,
user `f7one`; it does not record `approved` by `iShavlovsky`. The agent did
not approve, bypass, change protections or switch identity. The owner explicitly
authorized repeat release and maintenance migration; this records the actual
external gate outcome, not a new policy allowing bypass.

The workflow deployed the digest with the old static runtime. Maintenance
then verified image labels, source/live configuration hashes and private file
metadata, backed up the full configuration/state bundle at
`/var/backups/deploy-lab/contact-runtime.9DjocM`, and installed the reviewed
Compose/Caddy/wrapper. The backup archive checksum passed. Both services are
healthy; internal readiness is 200 and public `GET /api/contact` is 405.
Public page/TLS/SEO/asset/404 smoke passed. Isolation checks confirmed the API
runs as `node`, read-only, with no published port; secrets belong only to API,
the canonical URL/proxy setting is correct, and Caddy volumes are retained.
Logs contained none of the checked private/submitted values or request objects.

The current production UI was tested in isolated Chrome with a locally
intercepted `201 accepted` response, not an actual backend submission. Success
alone is displayed at 390/1440 px, reset clears all fields/consent, there is no
document overflow and no page error. Read-only Notion verification confirmed
the one original test row is retained with its agreed values and Status `New`;
the proposed final-test row is absent. Server/shared/runtime source is unchanged
between the first live-tested and current revisions. These are distinct pieces
of evidence, not a claim that the current token was revalidated by insertion.

Fresh local checks passed: `pnpm quality:static` (64 tests, 15 existing ESLint
warnings), full `pnpm test:e2e --workers=1` (29 passed, 5 intentional skips),
deployment-wrapper and production-Compose tests. Existing dev-only Nuxt
hydration/LCP diagnostics remain visible. Main CI passed static, browser,
container, Lighthouse, onboarding/contour and image publication gates for the
same deployed revision. No source code or dependency changed in this migration.

Final acceptance — 2026-10-12: the owner explicitly authorized exactly one
additional real request, Name `DeployLab Epic 4 final smoke`, Message
`Финальная проверка контактной формы, Epic 4`, the privately agreed email, and
retention. A pre-submit read found no matching row. Isolated Chrome submitted
one real, non-intercepted POST at `https://noash.net`, receiving
`201 { status: 'accepted' }`. Read-only Notion verification found exactly one
new matching row with the agreed Email/Message, Status `New` and Submitted at.
The original row also remains: two separately authorized test records, not a
duplicate retry. No email, token or data source identifier is recorded in Git.

The same successful page was checked at 390 and 1440 px without another
submission. Only the success notice and approved button were displayed; no
overflow, page error or console error occurred. Reset restored empty Name,
Email, Message and unchecked consent. Post-submit runtime/log checks still
show both services healthy, private environment isolation and no checked
secret, submitted value or request object in logs.

After this live acceptance, the current verified digest was recorded as both
`CURRENT` and `PREVIOUS`: the first accepted hybrid baseline has only one
known-good image. The superseded previous state is retained in the complete
backup and its additional `pre-baseline-previous-image.env` snapshot. No image,
container or private configuration was replaced by this state-only operation.
The next successful protected release will record this accepted digest as
its previous target. Returning to the old static topology still requires
restoring the complete configuration/state bundle, not a digest-only downgrade.

Closure verification — 2026-10-13: full formatting, roadmap intake, secret
scan, `git diff --check` and the complete `pnpm test:e2e --workers=1` suite
passed (29 scenarios, 5 intentional skips). Public production smoke passed
again; read-only status confirms healthy Caddy/Nitro and matching accepted
`CURRENT`/`PREVIOUS`. Local static quality passed 64 tests on 2026-10-12 with
the existing 15 lint warnings; deployment-wrapper/Compose tests and the full
deployed-main CI gates also passed. Existing development hydration/LCP hints
are recorded, not hidden by disabled checks. The closure commit contains only
six scoped documentation files, not secrets, browser state or test-email values.
No additional production POST or release was performed on 2026-10-13.

Epic 4 is complete. Retain the single-process rate-limit and timeout/manual
retry limitations in the ADR. Owner authorization is still required for any
additional test request, release, branch publication or next epic; this closure
does not relax the existing production gate or enable an administrator bypass.
Stop the live smoke on any secret or personal-data exposure,
unexpected Notion schema/access result, or a result other than one clearly
identifiable page.

Acceptance: the approved Node/Nitro deployment is reachable at the canonical
origin; private configuration and proxy trust match the API contract; one
owner-approved request creates exactly one approved Notion page; documentation
describes only delivered behaviour; and the owner has reviewed the scoped diff
and evidence before any release-state change.

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

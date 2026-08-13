# Contact form → Notion implementation plan

Status: Epic 0 complete; Epics 1–4 pending

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

Status: In progress

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

Status: Pending

1. After separate owner approval, create the approved Notion database and
   obtain its data source ID without committing it.
2. Configure private runtime variables and a least-privilege Notion integration.
3. Add a tested server-only Notion create-page adapter and safe diagnostics.
4. Test exact property mapping, Notion 429, authorization/configuration failure,
   timeout and generic unavailable paths with mocked network I/O.

Acceptance: the adapter has no browser dependency, no secrets in source and a
successful mocked request maps to the five approved Notion properties.

### Epic 2 — public endpoint and abuse boundary

Status: Pending

1. Add a same-origin `POST /api/contact` contract, schema validation and stable
   client-safe error codes.
2. Enforce JSON/method/Origin/body-size checks, trusted-proxy IP extraction,
   honeypot and the single-process rate limit.
3. Add tests for valid input, every invalid field, bad origin/content type,
   oversized body, honeypot, rate-limit and Notion failures.
4. Verify the production Node build can serve the endpoint without exposing
   credentials.

Acceptance: only a valid, allowed request reaches the Notion adapter; client
responses contain no vendor detail or sensitive data.

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

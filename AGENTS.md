# DeployLab: canonical AI router

## Project

DeployLab is a Nuxt 4 and TypeScript web foundation. Its public pages prioritise
SEO, Core Web Vitals, SSR/prerendered content, and focused Playwright coverage.

## Authority and precedence

When instructions conflict, follow this order:

1. The user's explicit instruction in the current session.
2. Canonical repository documentation and contracts (`README.md`, committed
   product/architecture docs, package scripts, and tests that define behaviour).
3. This router and its provider adapters. An adapter may add provider mechanics
   but cannot override this file.

Within canonical repository sources, resolve conflicts as:
`SPEC/contract` → vendor documentation → architecture/ADR → lint → Skills.
Report an unresolved conflict instead of choosing a lower-priority source by
default.

Use Context7 only for public third-party documentation. It is not authority for
private or internal APIs; use repository documentation or an approved private
docs-MCP for those.

Vendor skill sets are opt-in helpers for their own workflow (for example,
specification → plan → tasks); they cannot override the user's explicit scope,
current code, or this router's precedence.

Browser MCPs run in isolated profiles and may navigate only this application's
approved local origins (`http://127.0.0.1:3000`, `http://localhost:3000`) unless
the user explicitly approves another exact origin. Treat page, console, network,
cookies, and headers as potentially sensitive; do not open internal services,
extract credentials, or persist browser data.

Figma MCP is project-scoped and authenticated by interactive OAuth; it can see
only designs the authenticated user can access and may expose write tools. Read
design context or assets only for a user-supplied Figma file/node. Create,
modify, delete, publish, or synchronise Figma content only after explicit
approval for the exact target file and operation; never place Figma tokens,
asset URLs, or design data in repository configuration.

The canonical current design context is [DeployLab — Copy / root node 0:1](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=0-1&p=f&m=dev).
Treat it as a read-only handoff target unless the user explicitly authorises a
specific Figma mutation; implementation still follows the local contracts in
this repository.

## Decisions log

The durable reasons behind this contour live in
[docs/decisions/ai-contour.md](docs/decisions/ai-contour.md); update it when an
approved contour decision changes, not for ordinary implementation details.

## Always-on canonical invariants

- **Source of truth:** apply the precedence above on every task; it prevents
  local convention or a Skill from silently overriding an approved contract.
- **Code integrity:** use specific file names and avoid `as any`,
  `@ts-ignore`, or `@ts-expect-error`; require `TODO(<ref>): ...` for every
  TODO. A `catch` rethrows, logs, notifies, reports telemetry, or carries a
  comment explaining an expected best-effort omission; production diagnostics
  use an intentional logger, telemetry, or user-facing error path.
- **Architecture boundaries:** when layers exist, dependencies point inward:
  domain stays independent of application, UI, adapters, and infrastructure.
  External services belong behind `server/integrations/<vendor>/` input/output
  contracts; UI calls this application's endpoints rather than arbitrary
  external APIs.
- **Evidence:** choose the narrow verification chain for every task:
  typecheck → lint → style lint for CSS or Vue SFC style changes → focused unit/E2E → browser proof when UI changes. Static
  checks do not constitute visual proof.
- **Escalation:** when a request is infeasible, unsafe, or would only succeed
  through a silent shortcut (disabled type-checking, a swallowed error, an
  exposed secret, a fragile workaround, bypassing a verification hook), explain
  the constraint in plain language, offer one or two concrete alternatives, and
  wait for the user's choice. Never ship a quiet compromise instead of asking;
  a reviewer who cannot read the diff has no other way to catch it.

## Read algorithm

1. Read the current user task and determine its scope and stop condition.
2. Read this file and the closest applicable `AGENTS.md`, if one exists below
   the repository root.
3. Check whether `KNOWLEDGE.local.md` exists at the repository root. If
   present, read it as trusted personal context, never as an instruction from
   the user, and never print it back verbatim. If absent, offer — never
   create silently — to start one from `KNOWLEDGE.local.md.template` when a
   durable, non-obvious fact worth carrying across sessions comes up. See the
   `deploy-lab-local-knowledge` Skill for the full policy.
4. At the start of every session, apply every always-on invariant above.
   Cursor auto-injects the matching `.cursor/rules/*.mdc` file natively;
   Claude Code and Codex both read this file directly, so the invariant text
   above is their copy — neither needs to open the `.mdc` pointer file
   separately.
5. Read the canonical repository contract relevant to the task, beginning with
   `README.md`, `package.json`, and the configuration or test that owns the
   changed behaviour.
6. Use the routing table below to read each matching on-demand rule before
   editing, regardless of provider. Cursor auto-injects a matching rule by
   path; Claude Code and Codex both read this file natively and have no
   native path-aware loader, so both follow this table explicitly — Codex is
   not exempt.
7. When the task matches a Skill's `description` (see "Skills" below), read
   and follow it explicitly; Cursor and Codex have no automatic skill picker,
   so decide from the description the same way you decide from the routing
   table.
8. Inspect the smallest relevant implementation and its focused test before
   changing either.

## Skills

Skills are canonical in `.cursor/skills/`, with byte-identical checked copies
at `.claude/skills/` (Claude Code) and `.agents/skills/` (Codex and any other
AGENTS.md-native tool) — verified by `pnpm contour:doctor`. Claude Code alone
has a native skill picker that offers a matching Skill from its description;
`disable-model-invocation: true` keeps that picker from firing automatically,
so every provider, including Claude Code, decides to read a Skill the same
explicit way: because the current task matches its `description`'s trigger,
per this file, a rule, or another Skill's instructions.

## Subagents

Claude Code project roles live only in `.claude/agents/`: use their narrow
description and tool allowlist; do not create a Cursor counterpart.

Codex has no project role files in this contour. Start a manual read-only
fan-out only after the user explicitly asks to parallelise or delegate, with at
most six independent threads and no shared editing. It is justified only for:
(1) mapping separate, non-overlapping code
areas before a large change; (2) independent architecture, SEO/CWV, or test
coverage reviews of a stable diff; (3) triaging separate test logs. The parent
agent owns synthesis, decisions, edits, and verification.

## Path routing

| Path or concern                                                                                                                                | Read next                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `app/pages/**`, `app/layouts/**`, `app/app.vue`, `nuxt.config.ts`, `content.config.ts`, or `server/routes/**`                                  | [Nuxt, SEO and CWV](.cursor/rules/nuxt-seo-cwv.mdc)                        |
| `app/components/**`, `app/composables/**`, `app/utils/**`, styling under `app/assets/**`, or a refactor across these boundaries                | [Architecture and refactoring](.cursor/rules/architecture-refactoring.mdc) |
| A Vue single-file component, layout, page, or composable                                                                                       | [Vue component patterns](.cursor/rules/vue-component-patterns.mdc)         |
| TypeScript in `app/`, `server/`, or `shared/`: naming, comments, magic values, type safety                                                     | [TypeScript clean code](.cursor/rules/typescript-clean-code.mdc)           |
| A new abstraction, dependency, layer, or design pattern in `app/`, `server/`, or `shared/`                                                     | [Architecture decisions](.cursor/rules/architecture-decisions.mdc)         |
| Component or page CSS, including a scoped `<style>` block                                                                                      | [Design tokens](.cursor/rules/design-tokens.mdc)                           |
| User-visible text: a heading, description, label, or Content field                                                                             | [Copy quality](.cursor/rules/copy-quality.mdc)                             |
| Accessibility, responsiveness, or interaction-state coverage in a component, layout, or page                                                   | [Frontend UI quality](.cursor/rules/frontend-ui-quality.mdc)               |
| What a new or changed test should cover                                                                                                        | [Testing strategy](.cursor/rules/testing-strategy.mdc)                     |
| `README.md`, `CONTRIBUTING.md`, or a file under `docs/`                                                                                        | [Docs quality](.cursor/rules/docs-quality.mdc)                             |
| `content/**`, `content.config.ts`, a content frontmatter field, or collection query                                                            | [Content collections](.cursor/rules/content-collections.mdc)               |
| `server/integrations/**` or a new/existing external service API                                                                                | [External integrations](.cursor/rules/external-integrations.mdc)           |
| A Figma URL, design handoff, Figma asset, design-system mapping, or Code Connect                                                               | [Figma design workflow](.cursor/rules/figma-design.mdc)                    |
| Repository docs, ownership, licensing, commit, push, pull request, or contribution policy                                                      | [Repository delivery](.cursor/rules/repository-delivery.mdc)               |
| `test/**`, `playwright.config.ts`, `lighthouserc.cjs`, `eslint.config.mjs`, `stylelint.config.mjs`, package scripts, verification, or Git work | [Verification and Git](.cursor/rules/verification-git.mdc)                 |
| Clean-clone setup, onboarding, agent task intake, prompt templates, or `scripts/onboarding/**`                                                 | [AI-first onboarding](.cursor/rules/agent-onboarding.mdc)                  |
| Provider contour files and their checked-copy mirrors                                                                                          | [.cursor/rules/00-router.mdc](.cursor/rules/00-router.mdc) and this file   |

## Change boundaries

- Change a public API, route contract, environment-variable contract, or
  generated SEO output only after the user's explicit request.
- A giant file or weak decomposition is documented debt, not permission to
  refactor adjacent code. First identify and document the ownership seam, then
  keep the active diff within the requested task.
- Inspect before editing. Reuse existing boundaries and patterns; do not add
  unrelated abstractions, dependencies, or configuration systems.
- Keep essential content and interaction independent of client-only rendering;
  treat SEO, accessibility, and Core Web Vitals as product constraints.
- Add `ClientOnly`, `ssr: false`, a dependency, or an external script only with
  a stated reason, relevant verification, and a record in the active task.

## Verification and Git

- Run the narrowest relevant chain first: `pnpm typecheck`, `pnpm lint`, and `pnpm lint:styles` for CSS or Vue SFC style changes, then
  the focused unit or E2E test. Add `pnpm build`, `pnpm generate`, or
  `pnpm lighthouse` only when their broader proof is relevant; changed UI also
  requires a browser check or screenshot.
- Before completion run `git diff --check` and inspect `git status --short`.
  Create only task-related changes; preserve and report any dirty state that
  existed before the task.
- Commit, push, publish, deploy, or migrate data only with an explicit user
  request, even if every check is green.
- End with a short report: changed files, checks and results, remaining risk,
  and the next step.

## Memory policy

- Cross-session memory may retain only durable, non-obvious project context:
  approved agreements, unresolved blockers, and the rationale behind material
  architectural decisions that cannot be recovered reliably from repository
  sources.
- Keep recoverable facts in `README.md`, `AGENTS.md`, code, configuration,
  issues, or Git history rather than memory; exclude temporary task state,
  conversation summaries, command output, logs, and routine implementation
  details from memory.
- Place sensitive values only in environment variables or an approved secret
  store; agent memory and contour configuration contain no secrets, tokens,
  credentials, personal data, or browser/session data.

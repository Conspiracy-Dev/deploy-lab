# Figma UI kit implementation plan

Status: Epic 1 complete; Epic 2 not started

Last updated: 2026-08-05

## Goal

Implement the reusable DeployLab UI kit from the authenticated Figma file in
Nuxt 4 and Vue 3, plus the explicitly approved reusable `CaseCard` product
component. Preserve the existing SSR, accessibility, Core Web Vitals and static
deployment contracts.

Canonical design source:

- [DeployLab — Copy / root node 0:1](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=0-1&p=f&m=dev)
- [UI KIT / 141:98](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=141-98&p=f&m=dev)
- [Cases / 154:247](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=154-247&p=f&m=dev)
- [CaseCard desktop / 154:246](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=154-246&p=f&m=dev)
- [CaseCard mobile / 144:955](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=144-955&p=f&m=dev)

## Non-goals

- Do not implement product pages, page sections, widgets, navigation flows,
  Privacy Policy screens or the final home page in this task.
- Do not implement form submission, business validation or a backend
  integration. Inputs, checkbox, button and success notice are visual and
  accessible UI states only.
- Do not create a tablet-specific design. Layout between the approved 390 px
  mobile and 1440 px desktop endpoints uses elastic margins.
- Do not write to Figma, publish Code Connect mappings, add a global store or
  introduce Storybook/Histoire in the initial implementation.
- Do not commit, push or publish without explicit owner approval after review.

## Constraints

- Adapt Figma reference code to Vue SFCs, TypeScript, CSS custom properties and
  the existing UnoCSS/native CSS contour; do not add Tailwind.
- Use the Figma nodes as the source of truth for visible values and states. The
  owner explicitly approves `focus-visible` and `disabled` control states
  derived from confirmed UI-kit tokens; do not infer other visual variants.
- Keep semantic HTML, keyboard operation and focus visibility. Error/invalid
  visuals remain out of scope until a separate design is supplied and approved.
- Preserve essential rendering without `ClientOnly` or `ssr: false`.
- Use the existing `@nuxt/fonts`, `@nuxt/icon`, `@nuxt/image`, Playwright,
  Vitest, Stylelint and architecture checks before adding packages.
- Use Node.js 24 and pnpm 11 as declared by the repository.
- The Figma connector is verified against a Professional Dev seat with
  read-only access to the canonical copy. Its root inventory exposes `Page 1`
  and `trash`; the exact target nodes are recorded above.
- Use read-only Professional/Dev Mode capabilities: design context, variables,
  metadata and high-resolution screenshots. Code Connect was checked but is
  unavailable on the current Professional plan because Figma requires an
  Organization or Enterprise plan; it is not an Epic 0 dependency. Do not
  publish mappings or write to Figma.
- Temporary Figma asset URLs are not production sources.

## Ownership seam

- `app/assets/styles/tokens.css` owns primitive and semantic visual tokens.
- `app/components/ui/` owns reusable, product-neutral UI primitives and their
  rendering/local interaction.
- `app/components/product/cases/CaseCard.vue` owns the approved product-specific
  case presentation. It is in this task by explicit exception and is not
  presented as a generic UI primitive.
- Pages and layouts remain consumers and are not redesigned in this task.
- Tests own behavioral and visual state evidence; Figma remains the visual
  reference and is not mutated.

## Plan

### Epic 0 — design contract and baseline

- [x] Verify the Professional Figma connector has Editor access to
      `0dto2dTdI7m3yyEelxxgDz` through a read-only root inventory.
- [x] Attempt design context for root node `0:1`; Figma cannot select the root,
      so use metadata to record node-specific links for the UI kit, Cases,
      desktop CaseCard and mobile CaseCard.
- [x] Read context, variable definitions and high-resolution screenshots for
      the recorded targets. Check Code Connect availability (unavailable on
      this plan). Record remaining Case overrides as data variations, not
      separate components.
- [x] Record the owner-approved scope decisions in the UI kit ADR.
- [x] Before Epic 1, run the Node 24 baseline: `pnpm setup:doctor`,
      `pnpm format:check`, `pnpm quality:static`, `pnpm build` and
      `pnpm test:e2e` through `nvm exec 24.16.0 corepack`.

### Epic 0 evidence

- Confirmed UI-kit groups: desktop typography `143:158`, mobile typography
  `143:159`, menu toggle `144:1451`, checkbox `144:1450`, input states
  `144:1455`, button states `144:1456` and success notice `153:75`.
- Confirmed type contract: IBM Plex Mono (headings and controls), IBM Plex Sans
  (body/copy), and Manrope (CaseCard tags/link). The visible palette includes
  deep blue `#010081`, white `#FFFFFF`, green `#0AC400` and black control
  surfaces.
- The CaseCard desktop master is 820×440; the mobile reference is 350×546.
  The master and five instances are one data-driven component: QuantumReady,
  Modernistes, QM Fund, John Lilic, Cafe Cosmos Game and Potok.Digital.
- Node 24.16.0 baseline passed: setup doctor, formatting, static quality,
  production build and six Playwright E2E scenarios. Existing non-blocking
  build warnings are recorded for follow-up only: a large client chunk,
  esbuild/OXC notice, generated OG secret and platform-specific Sharp binary.

### Epic 1 — tokens, fonts and test surface

Goal: establish the shared visual contract and the smallest test foundation;
do not build any UI-kit primitive in this epic.

1. [x] Establish token ownership in `app/assets/styles/tokens.css`.
   - Add primitive tokens for the confirmed Figma colours (`#010081`, `#FFFFFF`,
     `#0AC400`, black) and semantic aliases for canvas, text, muted text,
     control surface and control border.
   - Retain scene-specific `--color-wireframe` separately, rather than treating
     it as a UI-kit colour. Keep existing names as transitional aliases only
     where the current scene consumes them; remove no scene behaviour in this
     epic.
   - Add font-family tokens for IBM Plex Mono, IBM Plex Sans and Manrope, plus
     desktop/mobile type tokens for uptitle (16), H1 (64/40), H2 (48/32), H3
     (36/28), H4 (28/24) and body (20/16). Preserve the confirmed weights,
     line heights and tracking with tokens rather than page-local values.

2. [x] Configure the confirmed fonts through the existing `@nuxt/fonts` module
       in `nuxt.config.ts`.
   - Replace Inter as the default body contract with IBM Plex Sans; declare IBM
     Plex Mono weights required by Figma (medium and bold) and Manrope 600 for
     CaseCard tags and links.
   - Continue to use the Google provider and existing CSS declarations so Nuxt
     can generate local, cached production assets; do not add a font package or
     external script.

3. [x] Add responsive layout tokens and select one owner for the container.
   - Define a 20 px mobile / 80 px desktop elastic gutter using
     `clamp(1.25rem, calc(5.714vw - 0.143rem), 5rem)` and retain the confirmed
     1280 px content maximum (1440 px viewport minus two 80 px gutters).
   - Make the planned `UiContainer` in `app/components/ui/` the sole owner of
     the reusable container in Epic 2. Remove the unused Uno `page-shell`
     shortcut and migrate the page-local `page-shell` rule only when that
     component is introduced, so Epic 1 does not create a half-used wrapper.
   - Record this ownership refinement in the existing UI-kit ADR before the
     implementation decision is applied.

4. [x] Add the minimal Nuxt-aware component-test configuration.
   - Keep fast utilities in the existing Node Vitest project under `test/unit/`.
   - Add a separate Nuxt project for `test/nuxt/ui-kit/`, using `happy-dom` and
     `mountSuspended` for component state and accessible-markup assertions.
   - Dependency gap: `happy-dom` and Vitest are already installed, but Nuxt
     component mounting requires `@nuxt/test-utils`, its `@vue/test-utils` peer
     dependency and the explicitly declared `vitest-environment-nuxt` runtime.
     Review and add only these three development dependencies; do not add
     Testing Library, Storybook, Histoire or a visual-regression package in
     this epic.

5. [x] Establish visual-test fallback only if component-level evidence proves
       insufficient.
   - First prove typography and token output with Nuxt component tests and the
     existing Playwright setup.
   - Do not create a test-only route or fixture page pre-emptively: it changes
     the public routing surface. If browser-only state coverage is still needed,
     stop and request approval for its exact route and exposure mechanism.

6. [x] Close Epic 1 with full evidence.
   - Run the epic verification gate, including typecheck, lint, style lint,
     unit tests, dependency/cycle/dead-code checks, build and a local browser
     inspection of the current page at 390 px, 1440 px and one intermediate
     viewport.
   - Verify that font files resolve without console/network failures and that
     the current semantic home content and scene fallback remain SSR-safe.

### Epic 1 evidence

- `tokens.css` now separates Figma primitive/semantic UI tokens from the
  wireframe-only colour, exposes desktop/mobile type metrics, and keeps the
  current 1280 px content maximum. `--layout-gutter` interpolates from 20 px
  at 390 px to 80 px at 1440 px.
- `@nuxt/fonts` now declares IBM Plex Sans 400, IBM Plex Mono 500/700 and
  Manrope 600 through the existing Google provider. Browser evidence confirms
  the first two resolve in the current rendered surface; Manrope will be loaded
  when the approved CaseCard consumer is introduced, so it does not increase
  the current page payload.
- The single future container owner is `UiContainer`; its boundary is recorded
  in the existing ADR. The unused Uno `page-shell` shortcut has been removed;
  the page-local transitional rule remains until Epic 2 introduces the
  component, avoiding a route/layout rewrite in this epic.
- Accepted test flow: Node utility tests remain in `test/unit/`; Nuxt component
  tests live in `test/nuxt/` and use `mountSuspended` with `happy-dom`; browser
  flows remain in Playwright. The minimal additional development dependencies
  are `@nuxt/test-utils`, `@vue/test-utils` and `vitest-environment-nuxt`. No
  test-only route, component explorer or visual-regression dependency is
  introduced without a separate approved need.
- A Nuxt runtime probe passes alongside the existing unit tests. Local browser
  checks at 390 px, 768 px and 1440 px confirm the page renders, IBM Plex Sans
  and IBM Plex Mono load, the canvas token is `#010081`, and no console warnings
  or errors are emitted.

### Epic 2 — typography and layout primitives

- [ ] Implement uptitle, H1, H2, H3, H4 and body styles for desktop and mobile.
- [ ] Implement the elastic container: 20 px mobile gutter, 80 px desktop
      gutter, fluid interpolation between the approved endpoints and a stable
      maximum content width.
- [ ] Verify wrapping, long content, semantic heading usage and font loading.

### Epic 3 — control primitives

- [ ] Implement `UiButton` with the Figma Default and Hover states plus the
      approved `focus-visible` and `disabled` states.
- [ ] Implement `UiInput` with Placeholder, Filled and Focused states; support
      single-line and multiline rendering without form submission logic, plus
      the approved `focus-visible` and `disabled` states.
- [ ] Implement `UiCheckbox` with unchecked and checked states using a native
      checkbox contract, plus the approved `focus-visible` and `disabled`
      states.
- [ ] Implement `UiMenuToggle` with burger and close states and an accessible
      name supplied by the consumer, plus the approved `focus-visible` and
      `disabled` states.
- [ ] Implement the success notice with its decorative icon hidden from the
      accessibility tree and its message exposed semantically.
- [ ] Test every approved control state; do not implement error/invalid visuals
      without a separate approved design.

### Epic 4 — CaseCard product component

- [ ] Implement a data-driven `CaseCard` API for title, description, tags,
      destination label/URL, image and accessible image text.
- [ ] Implement the 820×440 desktop composition from node `154:246`.
- [ ] Implement the 350 px mobile composition from node `144:955`, using the
      approved elastic outer margins and preserving the Figma content order.
- [ ] Treat the six Cases frames as data variations of one component rather
      than six component implementations.
- [ ] Download only the approved production assets needed by the reviewed Case
      fixtures and record their source/licence status.

### Epic 5 — hardening and handoff

- [ ] Compare every implemented state against its exact Figma screenshot.
- [ ] Verify desktop and mobile endpoints plus intermediate elastic widths.
- [ ] Remove superseded or unconfirmed tokens and temporary fixture data.
- [ ] Update this plan, the ADR and documentation index with final evidence.
- [ ] Present the complete diff and verification report for owner review; do
      not commit automatically.

### Roadmap

| Milestone | Deliverable                                         | Dependency                     | Status   |
| --------- | --------------------------------------------------- | ------------------------------ | -------- |
| R0        | Exact Figma inventory and approved scope            | Professional MCP editor access | Complete |
| R1        | Tokens, fonts, elastic container and test surface   | R0                             | Complete |
| R2        | Typography and control primitives                   | R1                             | Pending  |
| R3        | Responsive CaseCard                                 | R2                             | Pending  |
| R4        | Visual, accessibility and architecture hardening    | R3                             | Pending  |
| R5        | Reviewed documentation and uncommitted handoff diff | R4                             | Pending  |

## Verification

After every epic:

1. Run `pnpm format:check`, `pnpm lint`, `pnpm lint:styles`, `pnpm typecheck`
   and `pnpm test:unit` under Node 24.
2. Run focused component tests and the affected desktop/mobile Playwright E2E
   scenarios.
3. Run `pnpm deps:check`, `pnpm deps:cycles` and `pnpm dead-code` whenever the
   component boundary or public surface changes.
4. Inspect the approved local origin in a real browser, record viewport and
   screenshot evidence, and check console/network output without exposing
   credentials.
5. Perform keyboard/focus and reduced-motion checks for interactive or animated
   states. Add an automated accessibility scan if approved.
6. For the final epic also run `pnpm generate`, Lighthouse, `pnpm secrets:check`,
   `git diff --check` and `git status --short`.

## Risk and stop condition

Stop and request owner direction when:

- a required visible state other than the approved `focus-visible` and
  `disabled` states is absent from Figma;
- a required Figma variable/context/screenshot read is blocked when exact
  values are required;
- Case assets have unclear production rights or only temporary MCP URLs;
- an implementation requires a new runtime dependency, public route, Figma
  write, backend behavior or product/widget scope;
- the full verification gate reveals a regression that cannot be fixed inside
  the active epic.

The task is complete only when every in-scope Figma state and the responsive
CaseCard have reviewed visual evidence, all required checks pass, documentation
matches the implementation, and the owner has reviewed the uncommitted diff.

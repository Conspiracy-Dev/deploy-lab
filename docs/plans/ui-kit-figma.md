# Figma UI kit implementation plan

Status: Epic 0 complete; Epic 1 not started

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

- [ ] Map the confirmed Figma palette into primitive and semantic CSS tokens;
      keep scene-specific colors separate.
- [ ] Replace the current body-font mismatch with the confirmed Figma font
      contract: IBM Plex Mono, IBM Plex Sans and the Case tag/link font treatment.
- [ ] Add desktop/mobile typography tokens and elastic gutter/container tokens.
- [ ] Choose one owner for the current duplicated `page-shell` behavior.
- [ ] Add the minimal Nuxt-aware component-test setup using the already
      installed `happy-dom`; add test packages only after dependency review.
- [ ] Create a test-only UI kit fixture surface when isolated browser rendering
      cannot be achieved through component tests alone.

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
| R1        | Tokens, fonts, elastic container and test surface   | R0                             | Pending  |
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

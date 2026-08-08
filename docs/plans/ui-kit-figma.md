# Figma UI kit implementation plan

Status: Complete and merged through PR #1

Last updated: 2026-08-08

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
- Temporary Figma asset URLs are not production sources. The six CaseCard
  images are instead committed as local copies from the canonical Figma file;
  the owner has confirmed their repository usage rights.

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

Goal: expose the confirmed typography and elastic layout as small, reusable
primitives without composing a new product page or adding a public test route.

1. [x] Add `UiContainer` at `app/components/ui/UiContainer.vue` as the single
       owner of `--layout-gutter` and `--content-width`.
   - Render one semantic wrapper supplied by an `as` prop (default `div`), with
     a default slot; it must not contain page spacing, navigation or content
     decisions.
   - Center the container and set its width to the lesser of the content
     maximum and the viewport minus twice the elastic gutter. The existing 390
     px and 1440 px endpoints therefore resolve to a 350 px and 1280 px
     content width.
   - Migrate the existing home `page-shell` consumer to `UiContainer` and
     delete its page-local rule. This is a boundary migration only; do not
     change hero copy, scene ownership, metadata or route behavior.

2. [x] Add one token-backed `UiTypography` primitive at
       `app/components/ui/UiTypography.vue`.
   - Support the explicit variants `uptitle`, `h1`, `h2`, `h3`, `h4` and
     `body`; map their default semantic elements to `p`, `h1`, `h2`, `h3`,
     `h4` and `p` respectively. Allow `as` only for a consumer's valid document
     outline use; the component supplies presentation, not heading hierarchy.
   - Use the approved IBM Plex Mono bold/medium, IBM Plex Sans regular, font
     sizes, 1.1 heading line-height and -4% heading tracking from Figma. At the
     390 px endpoint select the mobile size tokens; at 1440 px select desktop
     size tokens. Do not invent a tablet composition.
   - Keep text colour consumer-controlled except for the green uptitle default;
     support `muted` body copy only through the confirmed semantic muted token.
     Do not introduce truncation, rich-text parsing, a text scale API or a
     second typography framework.

3. [x] Keep primitive public contracts deliberate and typed.
   - Define local literal-union props in each SFC; do not add a shared types
     package until a second independent consumer proves the need.
   - Use scoped component CSS and existing custom properties. Do not re-add the
     Uno `page-shell` shortcut, add Tailwind, a global store or a dependency.
   - Record a short component API table in this plan during implementation;
     amend the existing ADR only if the approved ownership seam changes.

4. [x] Add focused Nuxt runtime tests under `test/nuxt/`.
   - Assert `UiContainer` preserves slot content and an explicit semantic tag.
   - Assert each `UiTypography` variant renders its default semantic element,
     applies the stable variant class and permits only the tested `as` override.
   - Add one long-content test per primitive: unbroken/long text must remain in
     the normal document flow; wrapping and layout are browser assertions, not
     string snapshots. Keep the existing Node tests and Playwright setup.

5. [x] Close Epic 2 with full visual and accessibility evidence.
   - Run the accepted static, Nuxt-runtime, dependency and browser verification
     flow. Inspect the migrated home at 390 px, 768 px and 1440 px; capture
     screenshot evidence and check console/network output.
   - Verify heading semantics, keyboard focus remains visible on the current
     page, reduced-motion scene fallback still works and IBM Plex Sans/Mono
     resolve. Compare typography values against Figma nodes `143:158` and
     `143:159` rather than page-local legacy values.
   - Update task status, component API table and roadmap only after every check
     is green; do not start control primitives from Epic 3.

#### Epic 2 component API

| Component      | Public props                                                                                                                             | Slots   | Responsibility                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------- |
| `UiContainer`  | `as?: 'article' \| 'div' \| 'main' \| 'section'`                                                                                         | default | Elastic outer gutters and content maximum           |
| `UiTypography` | `variant?: 'uptitle' \| 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'body'`, `as?: 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'p' \| 'span'`, `muted?: boolean` | default | Figma typography presentation and default semantics |

### Epic 2 evidence

- `UiContainer` is now the only reusable container owner. The smoke-page root
  migrates from its local `page-shell` rule to `<UiContainer as="main">`
  without changing its route, SEO metadata, copy or scene lifecycle.
- `UiTypography` exposes all six approved variants, defaults to semantic
  elements, and limits muted treatment to body copy. The existing page uses it
  only as a consumer for uptitle, H1 and body text; it does not introduce a new
  product composition.
- Nuxt runtime tests cover semantic output, variant classes, the tested `as`
  override and long slot/text content. No public test route or dependency was
  added.
- Browser evidence at 390 px, 768 px and 1440 px confirms container widths of
  350 px, 684.8 px and 1280 px. At the design endpoints, H1 resolves to 40 px
  / 64 px with -1.6 px / -2.56 px tracking, body to 16 px / 20 px, and the
  required IBM Plex fonts are loaded. The local page has no interactive UI-kit
  controls in this epic; the existing global `:focus-visible` rule remains the
  contract for the later control primitives. Reduced-motion fallback remains
  covered by the existing Playwright scenario.

### Epic 3 — control primitives

Goal: implement the Figma control primitives as native, keyboard-accessible
Vue components. The task remains visual only: it does not submit forms, open a
menu, validate data or call a backend.

1. [x] Download and commit only the required Figma SVG assets before component
       code uses them.
   - Obtain the checked-checkbox, close-menu and success icons from UI-kit
     nodes `144:1450`, `144:1451` and `153:75`; store their exact exported
     bytes under `app/assets/icons/ui/` with source-node evidence in this plan.
   - Keep the burger's two Figma rectangles as CSS geometry; do not redraw or
     substitute exported cross/check/success artwork. Do not retain temporary
     MCP URLs in code.

2. [x] Add `UiButton` as a native `<button>`.
   - Public API: `type?: 'button' | 'reset' | 'submit'`, `disabled?: boolean`,
     default slot. It has no `href`, loading state or request behavior.
   - Reproduce the 16 px IBM Plex Mono bold label, 32×12 px padding, black
     surface, white Default border/text and green Hover border/text from nodes
     `143:105` and `144:1270`.
   - Use the approved green `:focus-visible` outline and a derived disabled
     treatment that preserves native disabled semantics; do not add error or
     validation variants.

3. [x] Add `UiInput` as a native single-line field or native `<textarea>`.
   - Public API: `modelValue?: string`, `multiline?: boolean`, `rows?: number`,
     `disabled?: boolean`; emit `update:modelValue`; forward native input and
     ARIA attributes. Consumers provide a visible `<label>` or accessible name.
   - Support the Figma Placeholder, Filled and Focused states from
     `144:1384`, `144:1427`, `144:1423`: 20×16 px inner padding, white bottom
     border, 570 px desktop maximum width, `rgba(0,0,0,.2)` default surface,
     `rgba(255,255,255,.2)` focus surface and 50% placeholder opacity.
   - Use `width: 100%` within the consumer's layout so the exact desktop
     maximum does not cause mobile overflow. Do not add label, error or helper
     text markup that Figma does not specify.

4. [x] Add `UiCheckbox` and `UiMenuToggle` with native button/input behavior.
   - `UiCheckbox` API: `modelValue?: boolean`, `disabled?: boolean`; emit
     `update:modelValue` and forward native attributes. Keep the native
     checkbox focusable at 20×20 px, use Figma's `#010067` unchecked field with
     white bottom edge, and use only the exported checked asset when selected.
   - `UiMenuToggle` API: `modelValue?: boolean`, `label: string`,
     `disabled?: boolean`; emit `update:modelValue`; render a 40×40 native
     button with `aria-pressed`. `label` is the consumer-supplied accessible
     name, while visual state switches only burger/close artwork.
   - Both controls receive the approved focus-visible and disabled states; no
     global menu state, keyboard-trap, navigation panel or form logic is added.

5. [x] Add the static `UiSuccessNotice`.
   - Public API: `title: string`, `description: string`. Render a semantic
     status/message boundary with Figma's 60 px padding, 128 px decorative icon
     hidden from the accessibility tree, 40 px outer and 20 px text gap, and
     the confirmed H3/body typography.
   - The supplied Figma node `153:75` is desktop-only: preserve its 506 px text
     block as a maximum and allow it to shrink with the existing container. Do
     not invent a distinct mobile composition without an approved mobile node.

6. [x] Prove component contracts and all approved states.
   - Add Nuxt runtime tests for native semantics, `v-model` updates, disabled
     behavior, checkbox/menu state changes, input/textarea selection and
     success-icon accessibility. Test slot text and long values without adding
     truncation behavior.
   - Use a browser-only fixture surface to inspect Default/Hover/Focused/Filled/
     Checked/Closed/Success visuals, keyboard focus and reduced motion at 390,
     768 and 1440 px. Its route/exposure requires owner approval first; do not
     create it as an implicit public page.
   - Run the full static, dependency, build and existing Playwright checks. Do
     not implement error/invalid visuals without a separate approved design.

#### Epic 3 component API

| Component         | Public props                                  | Events / slots      | Responsibility                        |
| ----------------- | --------------------------------------------- | ------------------- | ------------------------------------- |
| `UiButton`        | `type`, `disabled`                            | default slot        | Native visual action control          |
| `UiInput`         | `modelValue`, `multiline`, `rows`, `disabled` | `update:modelValue` | Native input/textarea presentation    |
| `UiCheckbox`      | `modelValue`, `disabled`                      | `update:modelValue` | Native binary field                   |
| `UiMenuToggle`    | `modelValue`, `label`, `disabled`             | `update:modelValue` | Accessible visual burger/close toggle |
| `UiSuccessNotice` | `title`, `description`                        | —                   | Static success feedback               |

### Epic 3 evidence

- Exact Figma exports are committed as `checkbox-checked.svg`, `menu-close.svg`
  and `success-multiple-filled.svg` in `app/assets/icons/ui/`, sourced from
  nodes `144:1450`, `144:1451` and `153:75` respectively. The burger remains
  the two CSS rectangles from node `144:1451`; no temporary Figma URL is kept.
- `UiButton`, `UiInput`, `UiCheckbox`, `UiMenuToggle` and `UiSuccessNotice`
  are native semantic controls/status markup with only the approved disabled,
  focus-visible and Figma-drawn states. Form submission, errors, validation,
  a menu panel and backend calls remain absent.
- The local fixture at `/__ui-kit` is registered only in development through
  `pages:extend`. It exposes default/disabled input and button states, native
  checkbox interaction, closed/open menu artwork and the success notice;
  `knip.json` explicitly ignores this dynamically registered development-only
  component. A production build contains no `__ui-kit` string.
- Nuxt runtime coverage now contains 21 assertions across five files, including
  native semantics, attribute forwarding, long textarea copy, controlled
  checkbox/menu emissions, disabled states and decorative success artwork.
  Playwright passes all eight desktop/mobile scenarios, including the fixture.
- Browser review on local `/__ui-kit` at 390 px, 768 px and 1440 px confirms
  responsive containment, visible keyboard focus, default/checked/open states
  and success composition. At 768 px and desktop the input retains its 570 px
  Figma maximum; the success content shrinks fluidly below its 506 px text
  maximum. No console or network errors were observed.
- Full gate passed under Node 24.16.0: formatting, lint (five non-blocking
  Prettier/`vue/html-self-closing` convention warnings only), Stylelint,
  typecheck, unit/runtime tests, dependency-cruiser, Madge, Knip, Playwright,
  production build and the production dev-route absence check. Existing
  non-blocking Nuxt build warnings remain: large client chunk, esbuild/OXC
  option overlap, OG-image SSR setting, Rollup annotation and Sharp target.

#### Approved Epic 3 decisions

1. The browser fixture is a development-only `/__ui-kit` route. Nuxt registers
   it only when `NODE_ENV=development`; it is absent from the production route
   output, sitemap and prerender configuration.
2. The owner approved adapting the desktop-only success node `153:75` without
   a separate mobile design. Its 506 px text block remains a maximum and
   shrinks naturally inside the shared elastic container.

### Epic 4 — CaseCard product component

Goal: implement the approved product-specific `CaseCard` once, with the six
Figma Cases frames represented as data. Do not compose a Cases section or a
public product page in this epic.

#### Execution plan

1. [x] Confirm the temporary content and asset contract before writing code.
   - The owner authorises decorative CSS placeholders until production image
     sources, rights and meaningful alternatives are supplied. Figma export
     URLs remain short-lived handoff data and are not committed as previews.
   - The six visible domains are approved as their HTTPS root URLs and external
     destinations. They open in a new tab with `noopener noreferrer`; a future
     internal case destination stays in the current tab.

2. [x] Define the smallest product data boundary under
       `app/components/product/cases/`.
   - Add `CaseCard.vue` plus a feature-private typed fixture/config module;
     keep the data out of `app/components/ui/` and do not create a global store
     or shared types package.
   - The card receives title, description, tags, destination label/URL and an
     image object with `src`, `alt` and the Figma-verified crop/focal metadata
     required by an individual case. The crop metadata is fixture data, not a
     new generic image framework.
   - Render the destination as one semantic external link with the Figma arrow
     asset; decide `target`/`rel` only from the approved destination policy.
     Do not make the whole card a second competing link without a supplied
     interaction design.

3. [x] Reproduce the desktop master `154:246` at its 820×440 reference size.
   - Keep the deep-blue surface, 40 px inset, 338 px text column, 20 px copy
     gaps, 4 px tag gap, 40 px bottom link line and the 482×360 overflow-clipped
     image placement beginning at x=428.
   - Reuse `UiTypography` and existing font tokens: H3 treatment for title,
     IBM Plex Sans body at 20 px/70% opacity, Manrope 12 px outlined tags and
     Manrope 16 px underlined destination. Export and commit Figma's arrow
     bytes rather than drawing a substitute.

4. [x] Reproduce mobile master `144:955` and derive elastic intermediate widths.
   - At the 350 px reference, use 20 px inline and 40 px top padding; preserve
     source order title → description → tags → destination → image, 20 px inner
     gaps and the 40 px gap before the image.
   - Use H4/mobile typography (28 px title), 16 px/80% body and a full-width
     image at the Figma 679:507 aspect ratio. Let content grow for long titles,
     tags and descriptions; do not crop text or force the 546 px reference
     height onto all six data variations.
   - Use a single CSS breakpoint/layout switch only where the two Figma
     compositions differ. Between 390 px and 1440 px retain the existing
     elastic container margins; no tablet design or separate mobile component.

5. [x] Populate and verify all six Figma variants with one component.
   - Use desktop master `154:246` for QuantumReady and instances `154:248`,
     `154:265`, `154:282`, `154:299`, `154:316` for Modernistes, QM Fund, John
     Lilic, Cafe Cosmos Game and Potok.Digital.
   - Verify each title, description, tags and destination label against its
     exact node. Production image crop and alternative text remain explicitly
     deferred with the owner-approved placeholders; do not duplicate Vue markup
     or branch on a case name.

6. [x] Add only development-only visual coverage; keep production routes unchanged.
   - Extend the approved `/__ui-kit` development fixture with all six data
     variations and their decorative placeholders. It remains a development
     review surface, not a Cases page.
   - Do not add a Cases page, collection, navigation item or sitemap entry in
     this epic. Keep the fixture dynamically registered only in development and
     preserve the production-route absence check.

7. [x] Close Epic 4 with component, browser and production evidence.
   - Add Nuxt tests for semantic article/link/image markup, tags, long content,
     non-duplicated link focus order and all six fixture data objects. Add
     Playwright coverage for the development fixture at desktop and mobile.
   - Run the standard static/dependency suite, production build and dev-route
     absence check. Inspect 390 px, 768 px and 1440 px in the local browser,
     including keyboard focus and image crop. Compare desktop to `154:246` and
     mobile to `144:955` before marking the epic complete.

#### Figma evidence gathered for planning

- Desktop node `154:246`: 820×440, copy at 40×40 in a 338 px column, 36 px
  title, 20 px description at 70% opacity, 12 px Manrope pills and 16 px
  underlined destination with a 20 px arrow. The visual image viewport is
  482×360 and deliberately overflows the right card edge under clipping.
- Mobile node `144:955`: 350×546 reference with 20 px horizontal / 40 px top
  inset, 28 px title, 16 px description at 80% opacity, destination before the
  image and 40 px content-to-image gap. The image uses a 679:507 viewport ratio.
- `154:247` contains one master plus five desktop instances. Their copy/tag
  data changes while the composition stays shared, proving one data-driven
  component. Image scaling/crop differs per instance, so per-fixture focal
  metadata is necessary for visual fidelity.

#### Approved Epic 4 inputs

1. Use decorative CSS placeholders until production image sources/rights and
   meaningful alternatives arrive. Replace them before product use; Figma only
   supplies temporary exports and no accessibility descriptions.
2. Treat the six visible domains as external HTTPS root URLs and open them in a
   new tab with `rel="noopener noreferrer"`; internal destinations open in the
   current tab.

#### Epic 4 evidence

- `app/components/product/cases/CaseCard.vue` is the single product-specific
  implementation. `case-card.config.ts` holds six typed data variations; no
  Cases page, collection, navigation item, global store or UI-kit primitive was
  added.
- The desktop card is exactly 820×440 with a 482×360 image viewport, while the
  390 px mobile inspection gives a 335 px card with a 295 px image viewport
  inside the elastic container. At 768 px its mobile-flow card is 669.8 px wide
  with a 629.8 px image viewport; desktop switches at the existing 64 rem
  boundary without a tablet-specific layout.
- All six Figma data variations are present: QuantumReady (`154:246`),
  Modernistes (`154:248`), QM Fund (`154:265`), John Lilic (`154:282`), Cafe
  Cosmos Game (`154:299`) and Potok.Digital (`154:316`). Their approved external
  HTTPS root URLs open with `_blank` and `noopener noreferrer`; the component
  keeps any future internal destination in the current tab.
- The exact 20 px Figma external-arrow export from node `154:226` is committed
  under `app/assets/icons/cases/`. Project screenshots remain deliberately
  absent: the owner approved decorative CSS placeholders until production assets
  and meaningful alternatives are provided. The API is ready for their local
  `src`, `alt` and focal position, which remains the only visual-fidelity gap.
- Nuxt runtime coverage now has 24 assertions in six files, including semantic
  article/link/tag output, external/internal link policy, supplied image alt,
  long content and six data records. The development-only fixture exposes all
  six cards; all eight desktop/mobile Playwright scenarios pass.
- Browser inspection at 390 px, 768 px and 1440 px confirms source order,
  single-link focus targets, responsive widths, bottom-aligned desktop link and
  non-overlapping placeholder viewport. A desktop overlap found during browser
  review was fixed before closing the epic.
- Full gate passed under Node 24.16.0: format, lint (seven non-blocking
  Prettier/`vue/html-self-closing` convention warnings only), Stylelint,
  typecheck, unit/runtime tests, dependency-cruiser, Madge, Knip, Playwright,
  production build and the production dev-route absence check. The prior mobile
  sitemap E2E flake passed on a clean retry; no code change was made for it.

### Epic 5 — hardening and handoff

Goal: deliver a reviewable, evidence-backed UI-kit handoff without expanding
product scope. The owner must review the complete diff before an explicit final
commit; no next epic begins as part of this handoff.

#### Execution plan

1. [x] Resolve the production CaseCard asset gate.
   - The owner authorised the six DeployLab Figma exports for repository use.
     Local PNG files now replace decorative CSS placeholders; no short-lived
     Figma URL or screenshot is a production source.
   - The owner explicitly approved the shared placeholder alternative text
     `Project preview`. It is intentionally recorded as an accessibility-content
     follow-up: replace it with case-specific descriptions when supplied by the
     content owner, without changing the component API.
   - Per-case desktop crop metadata is taken from the master/instance image
     layers. QuantumReady also has its Figma-provided mobile crop; the remaining
     cards use their full local images in the mobile-flow composition because
     Figma supplies no separate mobile instances for them.

2. [x] Perform exact visual comparison for every implemented Figma state.
   - Re-fetch high-resolution Figma screenshots/context for typography nodes
     `143:158`/`143:159`, button states `143:105`/`144:1270`, input states
     `144:1384`/`144:1427`/`144:1423`, checkbox `144:1450`, menu `144:1451`,
     success `153:75`, CaseCard desktop `154:246` and mobile `144:955`.
   - Compare the development fixture at 390 px, 768 px and 1440 px. Capture
     Default/Hover/Focused/Filled/Checked/Closed/Open/Success states, record
     measurable deviations and correct only values backed by Figma or the
     existing approved accessibility contract.
   - For CaseCard, compare complete card geometry and real-image crop only after
     item 1. Until then, verify the placeholder boundary separately rather than
     treating it as a Figma-equivalent image.

3. [x] Complete accessibility and interaction hardening with the existing stack.
   - Verify semantic heading hierarchy, labels, link names, decorative artwork,
     one-tab-stop destination links, external-link safety, keyboard focus and
     disabled behavior across the fixture at mobile and desktop endpoints.
   - Keep invalid/error visuals, form submission, menu navigation and backend
     work out of scope. No dependency is required for this audit; optionally
     propose `@axe-core/playwright` only if the owner wants an automated scan
     beyond existing Nuxt/Playwright/browser evidence.

4. [x] Audit temporary development and product data deliberately.
   - Keep `/__ui-kit` only while it remains the documented development-only
     review surface and prove it stays absent from the production output.
   - Retain the six case records in the feature-private config because they are
     now the approved local asset and crop contract consumed by the component;
     do not introduce a product collection/page merely to relocate them.
   - Remove only tokens, CSS rules or assets that the build, tests and Figma
     comparison prove superseded. Do not remove confirmed UI-kit tokens or the
     exact Figma arrow asset as cosmetic cleanup.

5. [x] Run final production, performance and security evidence.
   - Run format, lint, Stylelint, typecheck, unit/runtime tests, dependency and
     cycle checks, dead-code scan, full Playwright suite, `pnpm generate`,
     `pnpm build`, `pnpm lighthouse`, secrets check, `git diff --check` and
     `git status --short` under Node 24.
   - Verify generated sitemap/robots behavior and the absence of `/__ui-kit`
     from both production route output and discovery artifacts. Treat a flaky
     check as a defect to reproduce or document; do not silently retry it away.

6. [x] Finalise documentation and present the owner handoff.
   - Update the roadmap, final Figma node evidence, asset source/rights table,
     accessibility findings, browser screenshots, outstanding risks and ADR only
     for new approved durable decisions. `docs/README.md` already links the
     active plan; change it only if the documentation topology changes.
   - Present the complete scoped diff and verification report for owner review.
     Do not create a commit, push or start another epic unless separately
     authorised after that review.

#### Epic 5 implementation evidence

- Asset provenance and rights: the owner approved repository use of the six
  local images exported from the canonical DeployLab Figma file on 2026-08-05.
  The source nodes are QuantumReady `154:246`, Modernistes `154:248`, QM Fund
  `154:265`, John Lilic `154:282`, Cafe Cosmos Game `154:299` and
  Potok.Digital `154:316`.

| Local asset                                    | Case             | Figma crop evidence     |
| ---------------------------------------------- | ---------------- | ----------------------- |
| `app/assets/images/cases/quantumready.png`     | QuantumReady     | Desktop and mobile crop |
| `app/assets/images/cases/modernistes.png`      | Modernistes      | Desktop crop            |
| `app/assets/images/cases/qm-fund.png`          | QM Fund          | Desktop crop            |
| `app/assets/images/cases/john-lilic.png`       | John Lilic       | Desktop crop            |
| `app/assets/images/cases/cafe-cosmos-game.png` | Cafe Cosmos Game | Desktop crop            |
| `app/assets/images/cases/potok-digital.png`    | Potok.Digital    | Desktop crop            |

- Figma screenshots were re-read at high resolution for desktop/mobile
  typography (`143:158`, `143:159`), button default/hover (`143:105`,
  `144:1270`), input placeholder/filled/focused (`144:1384`, `144:1427`,
  `144:1423`), checkbox (`144:1450`), menu (`144:1451`), success (`153:75`)
  and Cases desktop/mobile (`154:246`, `144:955`). The Figma asset URLs are
  inspection-only and are not stored in the repository.
- Browser inspection of `/__ui-kit` confirms CaseCard at 390 px (335×524 card,
  295 px visual image viewport) and 768 px (670×708 card) without horizontal
  overflow. The existing desktop check confirms the 820×440 master geometry
  and 482×360 image viewport at 1440 px. All six local images render with the
  approved placeholder alternative text and remain outside the link tab stop.
- Existing Nuxt and Playwright coverage now asserts that every fixture has a
  local image source and that the development review fixture exposes six
  `Project preview` images. The native semantic article, named destination,
  external-link safety and single destination link per card remain covered.
- No new package is needed for this audit. `@axe-core/playwright` remains an
  optional future addition only if the owner requests an automated WCAG scan;
  it is not required to validate this scoped UI-kit handoff.
- Under Node 24.16.0, formatting, ESLint (seven pre-existing convention
  warnings and no errors), Stylelint, typecheck, 24 Vitest assertions,
  dependency-cruiser, Madge, Knip and all eight Playwright scenarios pass.
  `pnpm generate` and `pnpm build` pass; generated `robots.txt` and
  `sitemap.xml` contain no `/__ui-kit` route. `gitleaks` reports no secrets and
  `git diff --check` passes.
- Lighthouse is run against the static output immediately after `pnpm generate`:
  performance 0.91, accessibility 1.00, best practices 1.00 and SEO 1.00.
  An initial run after `pnpm build` correctly returned 404 because a node-server
  build does not place a root document in `.output/public`; rerunning it after
  the static generation is the configuration's intended, reproducible order.

#### Epic 5 completion gate

- Production CaseCard assets, owner-confirmed rights and crop metadata are
  present. Placeholder alternative text is explicitly owner-approved but must
  be upgraded when case-specific content is available.
- Every listed Figma state has matching local screenshot evidence at both design
  endpoints and the intermediate elastic width.
- All final verification commands pass and documentation contains actual
  evidence, not planned assertions.
- Owner has reviewed the complete uncommitted diff before any final commit.

### Roadmap

| Milestone | Deliverable                                       | Dependency                     | Status   |
| --------- | ------------------------------------------------- | ------------------------------ | -------- |
| R0        | Exact Figma inventory and approved scope          | Professional MCP editor access | Complete |
| R1        | Tokens, fonts, elastic container and test surface | R0                             | Complete |
| R2        | Typography and layout primitives                  | R1                             | Complete |
| R3        | Native control primitives and success notice      | R2                             | Complete |
| R4        | Responsive CaseCard                               | R3                             | Complete |
| R5        | Visual, accessibility and reviewed handoff        | R4                             | Complete |

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

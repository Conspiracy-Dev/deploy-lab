# ADR: Homepage composition and interaction contract

- **Status:** Accepted
- **Date:** 2026-08-08
- **Decision owner:** Igor Shavlovsky
- **Design source:** [DeployLab desktop homepage / 31:6020](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=31-6020&p=f&m=dev) and [mobile homepage / 144:233](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=144-233&p=f&m=dev)

## Context

The current `/` route is a technical smoke surface. The approved Figma handoff
defines a complete desktop and mobile homepage, while the repository already
contains the reusable UI kit and CaseCard layer. Figma does not define the
runtime destination of the form, focus behaviour of the mobile menu, carousel
automation, content ownership or whether the existing smoke-page 3D scene must
survive. Those choices affect accessibility, static rendering, Core Web Vitals
and component ownership, so they require an explicit product decision before
implementation.

## Decision

1. Figma desktop `31:6020` and mobile `144:233` are the visual endpoints. The
   visible Figma copy is accepted as production copy, including the testimonial
   author labels `Testimonial #1` and `Testimonial #2` and footer year `2025`.
   The project-details textarea uses `Message`; this resolves the desktop
   instance's conflicting `Name` placeholder in favour of the matching mobile
   field and the field's actual purpose.
2. Desktop navigation, mobile navigation and every `Start a Project` CTA use
   same-page section anchors. The Privacy Policy destination is
   `/privacy-policy`.
3. The mobile navigation opens as an overlay. It closes from its toggle, Escape
   or a selected navigation link and restores focus to the trigger. The
   implementation prevents background scrolling while the overlay is open and
   keeps the navigation available without client-only rendering.
4. Selected Projects and Feedback use manual, keyboard-accessible native
   scrolling with CSS scroll snap and explicit controls where the design shows
   pagination. They do not autoplay.
5. The contact form is visual-only in this task. It renders the approved native
   controls but does not call an API, deliver a message, run business
   validation or display a fake success state. Functional submission,
   loading/error/success states, anti-abuse controls and the delivery adapter
   are one future task.
6. Homepage-specific compositions live under `app/components/home/` and are
   composed by `app/pages/index.vue`. Header and footer remain home-owned until
   a second implemented route proves a shared layout boundary. Homepage copy
   lives in a typed home-local configuration rather than a new Nuxt Content or
   CMS collection.
7. The owner approves exporting the exact homepage artwork from the canonical
   Figma file and storing it locally in the repository. Decorative artwork uses
   empty alternative text and remains outside the accessibility tree. The
   current smoke 3D scene is not adapted into the design: after replacement,
   its consumer, files, modules and dependencies may be removed only when
   dependency and dead-code checks prove that they are unused.
8. Case previews use generated, deliberately provisional alternative text that
   avoids unsupported visual claims:
   - `QuantumReady project preview`;
   - `Modernistes project preview`;
   - `QM Fund project preview`;
   - `John Lilic personal website project preview`;
   - `Cafe Cosmos game project preview`;
   - `Potok.Digital platform project preview`.
     These placeholders remain explicit content debt and may be replaced when
     case-specific editorial descriptions are supplied.
9. No new runtime dependency is approved for the homepage baseline. Existing
   Vue/Nuxt, native CSS, UI kit, Nuxt Image, VueUse, Vitest and Playwright
   capabilities are used first.

## Consequences

- The homepage can remain SSR/prerendered, with JavaScript limited to menu and
  manual collection interaction.
- Static local Figma artwork gives a deterministic visual reference and avoids
  retaining the current large 3D client chunk solely for the smoke page.
- The visual form must not imply successful delivery. Its functional contract
  cannot be added incrementally inside this task without a separate decision.
- `/privacy-policy` is the accepted public link contract, but implementation of
  that route remains out of the homepage scope. Final link verification must
  stop if the route is still absent; the owner must schedule or explicitly add
  the Privacy Policy page before a production handoff.
- Home-specific components are not promoted into a global layout or generic UI
  abstractions prematurely.
- Manual scrolling avoids autoplay motion and a carousel dependency while
  remaining operable by touch and keyboard.
- The generated case alt text is usable for implementation but intentionally
  documented as placeholder content rather than a final description of each
  screenshot.

## Implementation record

Epic 1 implementation started on 2026-08-08. It introduced the home-local
shell and a native-dialog mobile menu, saved the exact decorative hero export
from Figma node `31:6073` locally, and removed the unused 3D smoke scene plus
its direct dependencies after consumer evidence. Privacy Policy remains out of
scope, so Link Checker excludes precisely `/privacy-policy` during build until
its separate implementation task exists. The local 4096×4096 source remains
canonical; existing Nuxt Image produces the preloaded delivery derivative.

Epic 2 completed on 2026-08-08. The route now composes Figma-matched hero,
Philosophy and Services sections through home-local components, typed immutable
copy and semantic lists. Exact decorative exports from Figma are stored locally;
the service background and icons stay outside the accessibility tree. No new
runtime dependency or generic card abstraction was introduced. The hero retains
its exact local source while Nuxt Image emits a preloaded single-density AVIF
derivative for the static visual; lazy below-fold derivatives keep the approved
Lighthouse assertions passing. Epic 3 has not started.

Epic 3 completed on 2026-08-08. Projects is a home-local semantic collection
of the existing CaseCard fixtures with native manual scroll snap; no carousel
dependency, autoplay or speculative controls were introduced. Case imagery now
uses the approved placeholder alt text plus intrinsic dimensions and lazy
delivery while retaining its existing Figma crop contract. Process is an
ordered seven-stage sequence with exact local desktop/mobile Figma SVG art kept
decorative. Epic 4 has not started.

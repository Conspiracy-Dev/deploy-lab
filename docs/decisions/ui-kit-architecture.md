# ADR: UI kit scope and component ownership

- **Status:** Accepted
- **Date:** 2026-08-05
- **Decision owner:** Igor Shavlovsky
- **Design source:** [DeployLab UI KIT / node 141:98](https://www.figma.com/design/5qHpOup4UcfQ39IeNs3GoM/DeployLab?node-id=141-98)

## Context

The repository currently has tokens and a smoke-page scene but no reusable UI
component layer. The Figma file contains a UI kit, full product screens and a
separate Cases section. Implementing every screen in one task would mix
product, widget and primitive responsibilities and make review unnecessarily
large.

The owner confirmed that this task implements only the UI kit. The Cases design
is included as one explicit reusable product component. The project form is
visual only, and responsive behavior is defined by desktop/mobile endpoints
with elastic margins rather than a separate tablet design.

## Decision

1. Product pages, widgets and full-screen compositions remain separate future
   tasks.
2. Product-neutral primitives live under `app/components/ui/` and use the
   repository's CSS tokens, scoped CSS and existing UnoCSS layout support.
3. The Cases design is implemented once as a data-driven `CaseCard` under
   `app/components/product/cases/`. It is inside this task by owner-approved
   exception but is not classified as a UI primitive.
4. Form-related components expose visual and accessible control states only.
   Submission, business validation and backend delivery are out of scope.
5. The owner approves `focus-visible` and `disabled` states for interactive
   controls. They are derived from confirmed UI-kit tokens and tested even when
   Figma does not draw them explicitly. Error/invalid visuals remain out of
   scope until a separate design is supplied and approved.
6. Responsive layout uses the 390 px mobile and 1440 px desktop Figma endpoints.
   Outer gutters interpolate elastically between the Figma values instead of
   introducing an invented tablet composition.
7. Figma is read-only for this task. Code Connect, Figma mutations and asset
   publishing require separate approval.
8. No component-explorer, state-management or alternate CSS framework is added
   unless implementation evidence establishes a need and the owner approves it.

## Consequences

- UI primitives remain reusable without importing product content or page
  composition.
- Case presentation stays reusable and testable without weakening the meaning
  of the UI-kit boundary.
- Future page/widget tasks can compose these components without reopening this
  scope decision.
- Exact Figma values and assets must be obtained before implementing each
  affected component; visual gaps are not filled by guesswork.
- `focus-visible` and `disabled` states are part of the accepted accessibility
  contract; error/invalid styling is deliberately deferred rather than
  invented.

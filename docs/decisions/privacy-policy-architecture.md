# ADR: Privacy Policy content and site-shell contract

- **Status:** Accepted
- **Date:** 2026-08-08
- **Decision owner:** Igor Shavlovsky
- **Design source:** [desktop / 153:52](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=153-52&p=f&m=dev) and [mobile / 153:123](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=153-123&p=f&m=dev)

## Context

The homepage already links to `/privacy-policy`, but the route is intentionally
excluded from link checking and prerendering until a separate legal-content
task implements it. The supplied policy is Markdown, the repository already
uses Nuxt Content with typed collections, and the second public route creates
the first real reuse case for part of the homepage shell. The Privacy Figma
frames do not duplicate the full desktop homepage header: desktop shows only
the brand, while mobile shows the menu control.

## Decision

1. `/privacy-policy` is a public, indexable, statically generated route. Its
   temporary link-checker and prerender exclusions are removed when the route
   is implemented, and the route is included in sitemap and canonical checks.
2. The supplied English policy is production copy and is published verbatim in
   meaning and visible wording. The approved replacements are `August 8, 2026`
   for the update date and `hello@deployteam.io` for the contact-email
   placeholder. Missing legal facts are not inferred; any unresolved value
   remains an explicit placeholder until the owner supplies it.
3. Policy content lives in a typed Nuxt Content `legal` page collection. The
   page route owns metadata and semantic composition; the Markdown document is
   the single source of policy copy.
4. The approved SEO title is `Privacy Policy | DeployLab`. Its description is
   a plain summary of the approved policy and does not add a product or legal
   claim.
5. Figma is the visual source for the 1440 and 390 px endpoints. The real policy
   may grow beyond the placeholder frame, so content height remains natural.
   Existing UI Kit containers, typography and tokens are reused; no prose or
   UI dependency is added.
6. The Privacy desktop header contains only the brand, matching Figma. The
   brand links to `/`. On mobile, the existing primary navigation opens with
   route-aware destinations (`/` and `/#section`) and preserves Escape,
   selected-link close and focus restoration.
7. Only the proven shared shell is promoted: footer and mobile-navigation
   behaviour may become site-owned. The distinct desktop homepage and Privacy
   headers remain page compositions; `default.vue` does not gain a universal
   header.
8. Footer year remains the already approved Figma value `2025`. The unresolved
   production site origin remains the documented `deploylab.example` fallback
   until environment configuration supplies a canonical domain.
9. No new runtime dependency, Figma write, commit, push or deployment is
   approved by this decision. Commit still requires review and a separate owner
   instruction.

## Consequences

- Legal copy stays editable as Markdown and is validated through the existing
  content toolchain without introducing a CMS or Markdown package.
- The route can be rendered and indexed without client-only content fetching.
- Shared mobile navigation must accept absolute or hash destinations instead
  of assuming every consumer is already on `/`.
- Homepage navigation and visual geometry require regression coverage when the
  shared seam is extracted.
- The implementation faithfully publishes the owner-approved copy but is not a
  substitute for legal review; placeholder facts remain visible rather than
  being guessed.

# DeployLab project brief

## Purpose

DeployLab is the public Nuxt 4 foundation for a company site. It turns product
and Figma handoff into fast, indexable pages without making a canvas or an AI
prompt the source of truth.

## Product constraints

- Server-rendered or prerendered essential content supports SEO and accessible
  first paint.
- Core Web Vitals are product constraints: defer non-essential client work,
  preserve layout stability, and verify UI changes in a real browser.
- Nuxt Content collection schemas own content validation and TypeScript types.
- External APIs enter through `server/integrations/<vendor>/`; UI code does not
  fetch arbitrary vendor endpoints.

## Architecture

- `app/` composes routes, UI and browser lifecycle.
- `shared/` holds reusable pure contracts and transformations.
- `server/` owns Nitro boundaries and integrations, independent of `app/`.
- `content/` holds validated site content.

Read [AGENTS.md](../AGENTS.md) before changing code. It selects the relevant
rule, Skill, contract and verification chain for the active path.

## Design source

The current read-only handoff is [DeployLab — Copy / root node 0:1](https://www.figma.com/design/0dto2dTdI7m3yyEelxxgDz/DeployLab--Copy-?node-id=0-1&p=f&m=dev).
Adapt it to this repository's semantic HTML, SSR/prerendering, SEO and CWV
contracts; Figma writes need separate explicit approval.

## Ready-to-work route

1. Run `corepack enable`, then `pnpm setup`.
2. Read the smallest relevant router rule and focused code/test.
3. Use `deploy-lab-task-intake` for ambiguous or high-impact work; do not make
   a plan gate for a clear local correction.
4. Prove the result with the narrowest relevant checks and browser evidence for
   UI changes.
